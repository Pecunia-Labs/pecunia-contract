import React, { useEffect, useState } from 'react';
import { Container, Grid, GridItem, SimpleGrid, Box, Flex, InputGroup, InputLeftElement, Input, Avatar, Image, Heading, Button, Text } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { ethers } from 'ethers';

import Chartex from '../images/chartex.png';
import { NFTCONTRACT_ADDRESS, CONTRACT_ADDRESS }  from '../contractdata/config';

function Dashboard({ ethaddress, sequenceWallet, contractHeir, contractNFT }) {
  const [boxhash, setBoxhash] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [heirAddress, setheirAddress] = useState("")

  useEffect(() => {
    checkIsHeir();
  }, [contractHeir])

  const checkIsHeir = async () => {
    const bh = await contractHeir.user2boxhash(ethaddress);
    console.log(bh);
    if(bh !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
      setBoxhash(bh);
      setIsRegister(true);
    }
  }
  
  const registerHeir = async () => {
    try{
      const response = await fetch("http://localhost:4000/create-proof", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'psw': `123`,
          'owner': ethaddress,
        })
      });

      if (!response) {
        console.log('No response');
        return;
      }

      const { p } = await response.json();
      console.log(p);
      const transaction = await contractHeir.register(p.boxhash, p.proof, p.pswHash, p.allHash, "120");
      const tx = await transaction.wait();
      console.log(tx);
    }
    catch(err) {
      console.error(err);
    }
  }

  const addHeir = async () => {
    try{
      // const transactionMint = await contractNFT.mint(ethaddress, "");
      // const txMint = await transactionMint.wait();
      // console.log(txMint);

      // const transactionA = await contractNFT.approve(CONTRACT_ADDRESS, "1");
      // const txA = await transactionA.wait();
      // console.log(txA);

      const transaction = await contractHeir.rechargeWithAddress(ethaddress, heirAddress, NFTCONTRACT_ADDRESS, [], { value: ethers.utils.parseEther("0.001")});
      const tx = await transaction.wait();
      console.log(tx);
    }
    catch(err) {
      console.error(err);
    }
  }

  const withdrawSignature = async () => {
    try{
      const response = await fetch("http://localhost:4000/create-proof", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          'psw': `123`,
          'owner': "0x419841b03Ce220AB594C926bfbc0468333Ca9916",
        })
      });

      if (!response) {
        console.log('No response');
        return;
      }

      const { p } = await response.json();
      console.log(p);
      console.log(contractNFT);
      const transactionA = await contractNFT.approve(CONTRACT_ADDRESS, "3");
      const txA = await transactionA.wait();
      console.log(txA);
      const transaction = await contractHeir.withdrawSignature(p.proof, p.pswHash, p.allHash, "0x419841b03Ce220AB594C926bfbc0468333Ca9916", { gasLimit: 1e6 });
      const tx = await transaction.wait();
      console.log(tx);
    }
    catch(err) {
      console.error(err);
    }
  }

  return (
    <Grid
      templateRows='repeat(2, 1fr)'
      templateColumns='repeat(6, 1fr)'
    >
      <GridItem rowSpan={2} colSpan={1} bg='#074536' color="white">
        <Container>
          <Text fontSize='xl' color="white" style={{ marginTop: "10rem"}}>
            ACCOUNTS
          </Text>
          <Text fontSize='lg' color="white" mt="1">
            Account Summary Accounts
          </Text>

          <Text fontSize='xl' color="white" mt="10">
            TRANSACTIONS
          </Text>
          <Text fontSize='lg' color="white" mt="1">
            Fund Transfer Bills
          </Text>

          <Text fontSize='xl' color="white" mt="20">
            SERVICES
          </Text>
          <Text fontSize='lg' color="white" mt="1">
            Account Statements
          </Text>
          <Text fontSize='lg' color="white">
            Enroll New Account
          </Text>
          <Text fontSize='lg' color="white">
            Enroll Staking
          </Text>
        </Container>
      </GridItem>

      <GridItem colSpan={5}>
        <Container maxW='1100px' mt="3" mb="2">
          <InputGroup>
            <InputLeftElement
              pointerEvents='none'
              children={<SearchIcon color='green.300' />}
            />
            <Input variant='filled' placeholder='Search' />
          </InputGroup>
        </Container>

        <Box bg="#43B89C" pt="1" pb="4">
          <Container maxW='1100px' mt="3">
            <Flex>
              <Avatar name='Person' mr="7" />
              <div>
                <Text fontSize='md' color="white">Hi</Text>
                <Text fontSize='md' color="white">Hi, Your last login was 1/22/22</Text>
              </div>
            </Flex>
          </Container>
        </Box>
        <Container maxW='1100px' mt="3">
          <SimpleGrid minChildWidth='300px' columns={[2]} spacing={10} mb="10">
            <Box bg="#17B58F" borderRadius='lg' overflow='hidden' p="4">
              <Heading fontSize='md' color="white" mb="3">WELCOME</Heading>
              <Text fontSize='md' color="white">{ethaddress}</Text>
            </Box>
            <Flex justifyContent="space-between">
              <div>
                <Heading fontSize='md' mb="3">Account Name:</Heading>
                <Text fontSize='md'>User</Text>
              </div>
              <div>
                <Heading fontSize='md' mb="3">Available Funds:</Heading>
                <Text fontSize='md'>0 MATIC</Text>
              </div>
            </Flex>
          </SimpleGrid>

          <SimpleGrid minChildWidth='300px' columns={[2]} spacing={10} mb="10">
            <Box bg="#17B58F" borderRadius='lg' overflow='hidden' p="4">
              <Heading fontSize='md' color="white" mb="3">REGISTER HEIRS</Heading>
              {isRegister
                ? <>
                    <Heading fontSize='md' color="white" mb="3">Add HEIR </Heading>
                    <Input placeholder='Address' variant='filled' mb="3" onClick={(e) => setheirAddress(e.target.value)} />
                    <Button colorScheme='teal' onClick={addHeir}>
                      Add Heir
                    </Button>
                  </>
                : <>
                  <Button colorScheme='teal' onClick={registerHeir}>
                    Register
                  </Button>
                  <Button colorScheme='teal' onClick={withdrawSignature}>
                  Withdraw
                </Button>
                  </>
              }
            </Box>
            <SimpleGrid minChildWidth='150px' columns={[2]} spacing={5} mb="10">
              <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
                <Heading fontSize='md' color="white" mb="3">HEIR 1</Heading>
                <Text fontSize='md' color="white">Wallet Address</Text>
                <Text fontSize='md' color="white">Total MATIC: 0</Text>
              </Box>
              <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
                <Heading fontSize='md' color="white" mb="3">HEIR 2</Heading>
                <Text fontSize='md' color="white">Wallet Address</Text>
                <Text fontSize='md' color="white">Total MATIC: 0</Text>
              </Box>
            </SimpleGrid>
          </SimpleGrid>

          <SimpleGrid minChildWidth='300px' columns={[2]} spacing={10}>
            <Image src={Chartex} alt="Chart"/>
            <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
              <Heading fontSize='md' color="white" mb="3">LATEST TRANSACTIONS</Heading>
              
            </Box>
          </SimpleGrid>
        </Container>
      </GridItem>
    </Grid>
  )
}

export default Dashboard;