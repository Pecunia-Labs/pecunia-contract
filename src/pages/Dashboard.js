import React from 'react';
import { Container, SimpleGrid, Box, Flex, InputGroup, InputLeftElement, Input, Avatar, Image, Heading, Text } from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';

import Chartex from '../images/chartex.png';

function Dashboard() {
  return (
    <div>
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
            <Text fontSize='md' color="white">0x0...8u982u2</Text>
          </Box>
          <Flex justifyContent="space-between">
            <div>
              <Heading fontSize='md' mb="3">Account Name:</Heading>
              <Text fontSize='md'>User</Text>
            </div>
            <div>
              <Heading fontSize='md' mb="3">Available Funds:</Heading>
              <Text fontSize='md'>0 ETH</Text>
            </div>
          </Flex>
        </SimpleGrid>

        <SimpleGrid minChildWidth='300px' columns={[2]} spacing={10} mb="10">
          <Box bg="#17B58F" borderRadius='lg' overflow='hidden' p="4">
            <Heading fontSize='md' color="white" mb="3">REGISTER HEIRS</Heading>
          </Box>
          <Flex justifyContent="space-between">
            <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
              <Heading fontSize='md' color="white" mb="3">HEIR 1</Heading>
              <Text fontSize='md' color="white">Wallet Address</Text>
              <Text fontSize='md' color="white">Total ETH: 0</Text>
            </Box>
            <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
              <Heading fontSize='md' color="white" mb="3">HEIR 2</Heading>
              <Text fontSize='md' color="white">Wallet Address</Text>
              <Text fontSize='md' color="white">Total ETH: 0</Text>
            </Box>
          </Flex>
        </SimpleGrid>

        <SimpleGrid minChildWidth='300px' columns={[2]} spacing={10}>
          <Image src={Chartex} alt="Chart"/>
          <Box bg="#17B58F" borderRadius='lg' w='100%' p="4" mr="4">
            <Heading fontSize='md' color="white" mb="3">LATEST TRANSACTIONS</Heading>
            
          </Box>
        </SimpleGrid>
      </Container>
    </div>
  )
}

export default Dashboard;