import React from 'react';
import { Box, Container, Heading, Flex, Spacer, Button } from '@chakra-ui/react';

function Navbar() {
  return (
    <Container maxW='1100px' p={2}>
      <Flex minWidth='max-content' alignItems='center' gap='2'>
        <Box p='2'>
          <Heading size='md'>PECUNIA</Heading>
        </Box>
        <Spacer />
        <Button colorScheme='teal'>Connect your Wallet</Button>
      </Flex>
    </Container>
  )
}

export default Navbar;