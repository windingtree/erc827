pragma solidity ^0.4.24;


import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


// mock class using ERC20 Token
contract ERC20TokenMock is ERC20 {

  constructor(address initialAccount, uint256 initialBalance) public {
    _mint(initialAccount, initialBalance);
  }

}
