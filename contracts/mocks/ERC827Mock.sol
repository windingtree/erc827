pragma solidity ^0.5.0;


import "../ERC827/ERC827.sol";


// mock class using ERC827 Token
contract ERC827Mock is ERC827 {

  constructor(address initialAccount, uint256 initialBalance, bytes memory proxyBytecode) public ERC827(proxyBytecode) {
    _mint(initialAccount, initialBalance);
  }

}
