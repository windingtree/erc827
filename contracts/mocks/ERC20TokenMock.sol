pragma solidity ^0.4.24;


import "../ERC20/StandardToken.sol";


// mock class using ERC20 Token
contract ERC20TokenMock is StandardToken {

  constructor(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
