/* solium-disable security/no-low-level-calls */

pragma solidity ^0.4.24;

import "./ERC827TokenMockAllowedCallbacks.sol";

/**
 * @title ERC827Proxy
 *
 * @dev Proxy to forward tokens balance and allowance with arbitrary calls
 */
contract ERC827Proxy {

  ERC827TokenAllowedCallbacks public token;

  /**
   * @dev Constructor
   */
  constructor(ERC827TokenAllowedCallbacks _token) public {
    token = _token;
    bytes4 makeCallSig = bytes4(keccak256('makeCall(address,bytes)'));
    token.allowCallback(address(0), makeCallSig,
      ERC827TokenAllowedCallbacks.FunctionType.Approve
    );
    token.allowCallback(address(0), makeCallSig,
      ERC827TokenAllowedCallbacks.FunctionType.Transfer
    );
    token.allowCallback(address(0), makeCallSig,
      ERC827TokenAllowedCallbacks.FunctionType.TransferFrom
    );
  }

  /**
   * @dev Fallback function that give back all tokens received
   */
  function() {
    forwardTokens(msg.sender);
  }

  /**
   * @dev Forward arbitary calls with token balance or allowance
   * @param _target address The address which you want to transfer to
   * @param _data bytes The data to be executed in the call
   */
  function makeCall(address _target, bytes _data) public returns (bool) {
    require(msg.sender == address(token));

    forwardTokens(_target);

    // solium-disable-next-line security/no-call-value
    return _target.call.value(msg.value)(_data);
  }

  /**
   * @dev Give back all tokens balance and allowance to address
   * @param to address The address which you want to transfer to
   */
  function forwardTokens(address to) internal {
    uint256 callerBalance = token.balanceOf(address(this));
    uint256 callerAllowance = token.allowance(to, address(this));

    // Give back token balance
    if (callerBalance > 0)
      token.transfer(to, callerBalance);

    // Give back token allowance
    if (callerAllowance > 0)
      token.transferFrom(address(this), to, callerAllowance);
  }

}
