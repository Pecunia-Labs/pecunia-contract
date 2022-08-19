import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, Heading, Flex, Spacer, Button } from '@chakra-ui/react';
import { sequence } from '0xsequence';
import { ethers } from 'ethers';

import { ABI, CONTRACT_ADDRESS } from "../contractdata/config";

function Navbar({ setETHAddress }) {
  const changePage = useNavigate();

  const connectSequence = async () => {
    const wallet = await sequence.initWallet("mumbai", {
      networkRpcUrl: "https://matic-mumbai.chainstacklabs.com",
    });

    await wallet.connect();
    const signer = wallet.getSigner()
    const contract = new ethers.Contract("", [, signer);

    console.log(contract);
    
    const address = await wallet.getAddress();
    setETHAddress(address);
    changePage("/dashboard");
  }
  return (
    <Container maxW='1100px' p={2}>
      <Flex minWidth='max-content' alignItems='center' gap='2'>
        <Box p='2'>
          <Heading size='md'>PECUNIA</Heading>
        </Box>
        <Spacer />
        <Button colorScheme='teal' onClick={connectSequence}>
          Connect your Wallet
        </Button>
      </Flex>
    </Container>
  )
}

export default Navbar;