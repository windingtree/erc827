pragma solidity ^0.4.24;


import "../ERC827/ERC827.sol";


// mock class using ERC827 Token
contract ERC827TokenMock is ERC827 {

  constructor(address initialAccount, uint256 initialBalance) public {
    _mint(initialAccount, initialBalance);
  }

}
