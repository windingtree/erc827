pragma solidity ^0.4.24;

contract ERC20 {
  function transferFrom(address from, address to, uint amount) public returns (bool);
  function transfer(address to, uint amount) public returns (bool);
}

contract ERC777 {
  function send(address to, uint amount, bytes data) public;
}

contract VaultAttack {

  mapping (address => mapping (address => uint)) private balances;
  bool private duringDeposit;

  // ERC20 (requires approval)
  function deposit(ERC20 erc20, uint amount) external {
    require(erc20.transferFrom(msg.sender, this, amount));
    balances[erc20][msg.sender] += amount;
  }

  function withdraw(ERC20 erc20, uint amount) external {
    require(balances[erc20][msg.sender] >= amount);
    balances[erc20][msg.sender] -= amount;
    require(erc20.transfer(msg.sender, amount));
  }

  // ERC223 / ERC677 compatibility
  function tokenFallback(
    address from, uint amount, bytes data
  ) external returns (bytes4) {
    balances[msg.sender][from] += amount;
    return 0xc0ee0b8a;
  }

  function getBalance(
    address token, address account
  ) public view returns (uint256) {
    return balances[token][account];
  }

}
