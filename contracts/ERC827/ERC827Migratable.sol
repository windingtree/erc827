/* solium-disable security/no-low-level-calls */

pragma solidity ^0.5.2;

import "openzeppelin-solidity/contracts/token/ERC20/IERC20.sol";
import "openzeppelin-solidity/contracts/ownership/Ownable.sol";
import "./ERC827.sol";

/**
 * @title ERC827Migratable
 *
 * @dev An extension for an ERC827 token that allows the balance migration from
 * an ERC20 token, once the balance is moved to the ERC827 it cant be moved
 * back to the ERC20 contract.
 */
contract ERC827Migratable is ERC827, Ownable {

  IERC20 public erc20Token;


  /**
   * @dev Constructor
   * @param _erc20Token The address of the erc20 token where the balances will
   * be migrated.
   * @param _erc20Token The address of the erc20 token to be migrated
   */
  constructor(address _erc20Token) public {
    require(_erc20Token != address(0), "Incorrect ERC20 token address");
    erc20Token = IERC20(_erc20Token);
  }

  /**
   * @dev Migrates the approved balance from the ERC20 token to this contract
   * and adds the new balance to the msg.sender
   */
  function migrate() public {
    uint256 balanceToMigrate = erc20Token.allowance(msg.sender, address(this));
    erc20Token.transferFrom(msg.sender, address(this), balanceToMigrate);
    _mint(msg.sender, balanceToMigrate);
  }

  /**
   * @dev Migrates the approved balance from the ERC20 token * to this contract
   * and adds the new balance to the _from address
   * @param _from The address which you want to migrate the tokens
   */
  function migrateFrom(address _from) public onlyOwner {
    require(_from != address(0), "Cant migrate burned tokens");
    require(
      _from != address(this),
      "Cant migrate tokens that already have been migrated"
    );
    _mint(_from, erc20Token.balanceOf(_from));
  }

}
