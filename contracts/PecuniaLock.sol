//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Context.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
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

    event Withdraw(
        address indexed user,
        address indexed to,
        address tokenAddr,
        uint amount
    );

    struct SafeBox{
        bytes32 boxhash;
        address user;
        mapping(address => uint) heirToBalance;
        mapping(address => uint256) heirToTokenid;
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
        uint allHash
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
                [pswHash, uint160(0x00), 0, allHash]
            ),
            "PecuniaLock::register: verifyProof fail"
        );

        box.boxhash = boxhash;
        box.user = _msgSender();

        user2boxhash[box.user] = boxhash;

        emit Register(boxhash, box.user);
    }


    function rechargeWithBoxhash(
        address boxOwner,
        bytes32 boxhash,
        address tokenAddr,
        address heirAddr,
        uint amount,
        string memory tokenURI
    ) public 
    returns (uint256 tokenId){
        SafeBox storage box = boxhash2safebox[boxhash];
        require(box.boxhash != bytes32(0), "PecuniaLock::rechargeWithBoxhash: safebox not register yet");

        IERC20(tokenAddr).transferFrom(boxOwner, address(this), amount);
        box.heirToBalance[heirAddr] += amount;

        tokenId = heirToken.mint(heirAddr, tokenURI);
        box.heirToTokenid[heirAddr] = tokenId;
        emit Recharge(boxOwner, heirAddr, amount, tokenId);
    }


    function rechargeWithAddress(
        address boxOwner,
        address tokenAddr,
        address heirAddr,
        uint amount,
        string memory tokenURI
    ) public 
    returns (uint256 tokenId){
        bytes32 boxhash = user2boxhash[boxOwner];
        tokenId = rechargeWithBoxhash(boxOwner, boxhash, tokenAddr, heirAddr, amount, tokenURI);
    }


    function withdraw(
        uint[8] memory proof,
        uint pswHash,
        address tokenAddr,
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

        require(
            verifier.verifyProof(
                [proof[0], proof[1]],
                [[proof[2], proof[3]], [proof[4], proof[5]]],
                [proof[6], proof[7]],
                [pswHash, uint160(tokenAddr), amount, allHash]
            ),
            "PecuniaLock::withdraw: verifyProof fail"
        );
        uint256 tokenId = box.heirToTokenid[heir];
        require(tokenId > 0, "PecuniaLock::withdraw: token id invalid");
        require(heirToken.getApproved(tokenId) == address(this), "Approval for NFT Token not given");

        heirToken.burn(tokenId);
        usedProof[proof[0]] = true;
        box.heirToBalance[heir] -= amount;

        IERC20(tokenAddr).transfer(heir, amount);

        emit Withdraw(box.user, heir, tokenAddr, amount);
    }

    function onERC721Received(address, address, uint256, bytes memory) 
        public 
        virtual 
        override 
        returns (bytes4) 
    {
        return this.onERC721Received.selector;
    }

}