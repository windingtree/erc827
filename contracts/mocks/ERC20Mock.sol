pragma solidity ^0.5.0;


import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";


// mock class using ERC20 Token
contract ERC20Mock is ERC20 {

  constructor(address initialAccount, uint256 initialBalance) public {
    _mint(initialAccount, initialBalance);
  }

}
