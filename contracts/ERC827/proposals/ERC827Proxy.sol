/* solium-disable security/no-low-level-calls */

pragma solidity ^0.4.24;


/**
 * @title ERC827Proxy
 *
 * @dev Proxy to forward tokens balance and allowance with arbitrary calls
 */
contract ERC827Proxy {

  address public token;
  bytes4 public makeCallSig = bytes4(keccak256('makeCall(address,bytes)'));

  /**
   * @dev constructor
   */
  constructor() public {
    token = address(msg.sender);
  }

  /**
   * @dev Forward arbitary calls
   * @param _target address The address which you want to transfer to
   * @param _data bytes The data to be executed in the call
   */
  function makeCall(address _target, bytes _data) public payable returns (bool) {
    require(msg.sender == address(token));

    // solium-disable-next-line security/no-call-value
    require(_target.call.value(msg.value)(_data));
  }

}
