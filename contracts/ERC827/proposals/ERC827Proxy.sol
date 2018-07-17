/* solium-disable security/no-low-level-calls */

pragma solidity ^0.4.24;

import "../ERC827.sol";

/**
 * @title ERC827Proxy
 *
 * @dev Proxy to forward tokens balance and allowance with arbitrary calls
 */
contract ERC827Proxy {

  ERC827 public token;
  bytes4 public makeCallSig = bytes4(keccak256('makeCall(address,bytes)'));

  /**
   * @dev Set the token address, can be called only once
   * @param _token The ERC827 token to be used for the proxy
   */
  function setToken(ERC827 _token) public {
    require(token == address(0));
    require(_token != address(0));
    token = _token;
  }

  /**
   * @dev Forward arbitary calls with token balance or allowance
   * @param _target address The address which you want to transfer to
   * @param _data bytes The data to be executed in the call
   */
  function makeCall(address _target, bytes _data) payable public returns (bool) {
    require(msg.sender == address(token));

    uint256 callerBalance = token.balanceOf(address(this));
    uint256 callerAllowance = token.allowance(_target, address(this));

    // Transfer token balance
    if (callerBalance > 0)
      token.transfer(_target, callerBalance);

    // Transfer token allowance
    if (callerAllowance > 0)
      token.transferFrom(address(this), _target, callerAllowance);

    // solium-disable-next-line security/no-call-value
    require(_target.call.value(msg.value)(_data));
  }

}
