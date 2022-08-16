//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@chainlink/contracts/src/v0.8/KeeperCompatible.sol";
import "./verifier.sol";
import "hardhat/console.sol";
import "./mock/HeirToken.sol";

contract PecuniaLock is Context, IERC721Receiver {

    using Counters for Counters.Counter;
        
    Verifier verifier;
    
    HeirToken public heirToken;

    // Counters.Counter public tokenId;

    event Register(
        bytes32 indexed boxhash,
        address indexed user
    );
  
    event Recharge(
        address indexed sender,
        address indexed heirAddress,
        uint256 amount,
        uint256 tokenId
    );

    event WithdrawSigned(
        address indexed user,
        address indexed to,
        uint amount
    );

    event FundsAdded(
        uint256 amountAdded, 
        uint256 newBalance, 
        address sender
    );

    event FundsTransferred(
        uint256 amount,
        address heir
    );

    bytes32[] private boxHashes;

    struct SafeBox{
        bytes32 boxhash;
        address user;
        mapping(address => uint) heirToBalance;
        mapping(address => uint256) heirToTokenid;
        uint256 heirToInterval;
        uint256 lastTimeStamp;
        mapping(address => bool) withdrawSigned;
        address[] addresss;
    }

    mapping(bytes32 => SafeBox) public boxhash2safebox;

    mapping(address => bytes32) public user2boxhash;

    mapping(uint => bool) public usedProof;

    constructor() {
        verifier = new Verifier();
        heirToken = new HeirToken();
        heirToken.mint(address(this), "Genesis Token");
    }

    // function balanceOf(address user, address[] memory tokenAddrs) public view returns(uint[] memory bals) {
    //     bytes32 boxhash = user2boxhash[user];
    //     SafeBox storage box = boxhash2safebox[boxhash];
    //     bals = new uint[](tokenAddrs.length);
    //     for (uint i=0; i<tokenAddrs.length; i++) {
    //         address tokenAddr = tokenAddrs[i];
    //         bals[i] = box.balance[tokenAddr];
    //     }
    // }

    function heirIsValid(
        bytes32 boxhash,
        address heir
    ) public 
    view
    returns(bool){
        return boxhash2safebox[boxhash].heirToBalance[heir] > 0;
    }


    function register(
        bytes32 boxhash,
        uint[8] memory proof,
        uint pswHash,
        uint allHash,
        uint interval
    ) public {
        SafeBox storage box = boxhash2safebox[boxhash];

        require(user2boxhash[_msgSender()] == bytes32(0), "PecuniaLock::register: one user one safebox");
        require(box.boxhash == bytes32(0), "PecuniaLock::register: boxhash has been registered");
        require(keccak256(abi.encodePacked(pswHash, _msgSender())) == boxhash, "PecuniaLock::register: boxhash error");
        require(
            verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                [pswHash, 0, allHash]
            ),
            "PecuniaLock::register: verifyProof fail"
        );

        box.boxhash = boxhash;
        box.user = _msgSender();
        box.heirToInterval = interval;
        box.lastTimeStamp = block.timestamp;

        user2boxhash[box.user] = boxhash;
        boxHashes.push(boxhash);
        emit Register(boxhash, box.user);
    }


    function rechargeWithBoxhash(
        address boxOwner,
        bytes32 boxhash,
        address heirAddr,
        uint amount,
        string memory tokenURI
    ) public 
    returns (uint256 tokenId){
        require(amount > 0, "PecuniaLock::rechargeWithBoxhash: Insufficient Amount send");
        SafeBox storage box = boxhash2safebox[boxhash];
        require(box.boxhash != bytes32(0), "PecuniaLock::rechargeWithBoxhash: safebox not register yet");
        box.heirToBalance[heirAddr] += amount;

        tokenId = heirToken.mint(heirAddr, tokenURI);
        box.heirToTokenid[heirAddr] = tokenId;

        box.addresss.push(heirAddr);
        emit Recharge(boxOwner, heirAddr, amount, tokenId);
    }


    function rechargeWithAddress(
        address boxOwner,
        address heirAddr,
        string memory tokenURI
    ) public 
    payable
    returns (uint256 tokenId){
        bytes32 boxhash = user2boxhash[boxOwner];
        uint amount = msg.value;
        console.log("amount deposited=", amount);
        tokenId = rechargeWithBoxhash(boxOwner, boxhash, heirAddr, amount, tokenURI);
    }


    function withdrawSignature(
        uint[8] memory proof,
        uint pswHash,
        uint allHash,
        address boxOwner
    ) public {
        address heir = msg.sender;
        require(!usedProof[proof[0]], "PecuniaLock::withdraw: proof used");

        bytes32 boxhash = user2boxhash[boxOwner];
        require(keccak256(abi.encodePacked(pswHash, boxOwner)) == boxhash, "PecuniaLock::withdraw: pswHash error");
        require(heirIsValid(boxhash, heir), "PecuniaLock::withdraw: heir not valid");
        
        SafeBox storage box = boxhash2safebox[boxhash];
        require(box.boxhash != bytes32(0), "PecuniaLock::withdraw: safebox not register yet");
        
        uint256 amount = box.heirToBalance[heir];
        console.log("amount withdrawn", amount);

        require(
            verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                [pswHash, amount, allHash]
            ),
            "PecuniaLock::withdraw: verifyProof fail"
        );
        uint256 tokenId = box.heirToTokenid[heir];
        require(tokenId > 0, "PecuniaLock::withdraw: token id invalid");
        require(heirToken.getApproved(tokenId) == address(this), "Approval for NFT Token not given");

        heirToken.burn(tokenId);
        usedProof[proof[0]] = true;

        box.withdrawSigned[heir] = true;
        // TODO remove this
        checkUpkeep();
        emit WithdrawSigned(box.user, heir, amount);
    }

    function getMaturedBoxes() 
    public 
    view 
    returns(bytes32[] memory)
    {
        bytes32[] memory t_boxHashes = new bytes32[](boxHashes.length);
        uint count = 0;
        for(uint i=0; i< boxHashes.length; i++){
            bytes32 bh = boxHashes[i];
            SafeBox storage sb = boxhash2safebox[bh];
            address[] memory ad = sb.addresss;
            
            // TODO: change the condotion
            if(sb.lastTimeStamp + sb.heirToInterval >= block.timestamp){
                t_boxHashes[count] = bh;
                count++;
            }
            
        }

        if (count != boxHashes.length){
            assembly{
                mstore(t_boxHashes, count)
            }
        }
        return t_boxHashes;
    }

    function transferAmountToHeirs(bytes32[] memory maturedBoxes)
    internal
    {
        for(uint i=0; i< maturedBoxes.length; i++){
            address[] memory ad = boxhash2safebox[maturedBoxes[i]].addresss;
            for(uint j=0; j< ad.length; j++){
                if (
                 boxhash2safebox[maturedBoxes[i]].withdrawSigned[ad[j]] &&
                 boxhash2safebox[maturedBoxes[i]].lastTimeStamp + boxhash2safebox[maturedBoxes[i]].heirToInterval >= block.timestamp
                 ){
                    uint amount = boxhash2safebox[maturedBoxes[i]].heirToBalance[ad[j]];
                    console.log("paying amt, to:", amount, ad[j]);
                    bool success = payable(ad[j]).send(amount);
                    if (success){
                        boxhash2safebox[maturedBoxes[i]].heirToBalance[ad[j]] = 0;
                        console.log("Funds Transferred");
                        emit FundsTransferred(amount, ad[j]);
                    }
                    // TODO add else and gas optimization cond
                }
            }
        }
    }

    function checkUpkeep(/*bytes calldata  checkData */) 
    public 
    // view 
    // override 
    // returns (bool upkeepNeeded, bytes memory performData) 
    {
        (bytes32[] memory boxes) = getMaturedBoxes();
        bool upkeepNeeded = boxes.length > 0;
        console.log("checkUpkeep: upkeepNeeded: ", upkeepNeeded);
        bytes memory performData = abi.encode(boxes);
        console.log("checkUpkeep: after encode: performData");
        // TODO remove this
        performUpkeep(performData);
        // return (upkeepNeeded, performData);
    }

    function performUpkeep(bytes memory performData) 
    public 
    // override 
    {
        bytes32[] memory maturedBoxes = abi.decode(performData, (bytes32[]));
        console.log("performUpkeep: ");
        transferAmountToHeirs(maturedBoxes);
    }

    function onERC721Received(address, address, uint256, bytes memory) 
        public 
        virtual 
        override 
        returns (bytes4) 
    {
        return this.onERC721Received.selector;
    }

    receive() external payable {
    emit FundsAdded(msg.value, address(this).balance, msg.sender);
    }

}