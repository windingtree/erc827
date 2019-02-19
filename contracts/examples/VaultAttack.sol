pragma solidity ^0.5.0;


contract ERC20 {
  function transferFrom(address from, address to, uint amount)
    public returns (bool);

  function transfer(address to, uint amount) public returns (bool);
}


contract VaultAttack {

  mapping (address => mapping (address => uint)) private balances;
  bool private duringDeposit;

  // ERC20 (requires approval)
  function deposit(ERC20 erc20, uint amount) external {
    require(
      erc20.transferFrom(msg.sender, address(this), amount),
      "transferFrom failed"
    );
    balances[address(erc20)][msg.sender] += amount;
  }

  function withdraw(ERC20 erc20, uint amount) external {
    require(
      balances[address(erc20)][msg.sender] >= amount,
      "inssuficent balance"
    );
    balances[address(erc20)][msg.sender] -= amount;
    require(erc20.transfer(msg.sender, amount), "transfer failed");
  }

  // ERC223 / ERC677 compatibility
  function tokenFallback(address from, uint amount, bytes memory data)
    public returns (bytes4)
  {
    balances[msg.sender][from] += amount;
    return 0xc0ee0b8a;
  }

  function getBalance(address token, address account)
    public view returns (uint256)
  {
    return balances[token][account];
  }

}
