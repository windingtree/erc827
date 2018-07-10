/* solium-disable security/no-low-level-calls */

pragma solidity ^0.4.24;

import "../../ERC20/StandardToken.sol";


/**
 * @title ERC827, an extension of ERC20 token standard
 *
 * @dev Implementation the ERC827, following the ERC20 standard with extra
 * methods to transfer value and data and execute calls in transfers and
 * approvals. Uses OpenZeppelin StandardToken.
 */
contract ERC827TokenAllowedCallbacks is StandardToken {

  // @dev Enum to represent the type of token functions in uint8
  enum FunctionType { None, Approve, Transfer, TransferFrom }

  /**
   * @dev Signatures fo the callback allowed to be executed
   * Receiver => Sender => Function Signature => FunctionType => Allowed
   */
  mapping(address =>
    mapping(address =>
      mapping(bytes4 =>
        mapping(uint8 => bool)
      )
    )
  ) public allowedCallbacks;

  /**
   * @dev Modifier that check the callback that wants to be executed
   * If a receiver allows address(0) means that it can be called by anyone
   * If a receiver allows bytes4(0) means that any function can be called
   */
  modifier callbackAllowed(address to, bytes data, FunctionType functionType) {
    bytes4 functionSignature;
    assembly {
      functionSignature := mload(add(data, 32))
    }
    require(isCallbackAllowed(msg.sender, to, functionSignature, functionType));
    _;
  }

  /**
   * @dev Allows a callback function to be executed to a receiver contract
   * @param from address The address that can execute the callback
   * @param functionSignature bytes4 The signature of the callback function
   * @param fType FunctionType The type of the function
   */
  function allowCallback(
    address from, bytes4 functionSignature, FunctionType fType
  ) public {
    // TO DO: Check that msg.sender is a contract ?
    allowedCallbacks[msg.sender][from][functionSignature][uint8(fType)] = true;
  }

  /**
   * @dev Remove a callback function to be executed to a receiver contract
   * @param from address The address that can execute the callback
   * @param functionSignature bytes4 The signature of the callback function
   * @param fType FunctionType The type of the function
   */
  function removeCallback(
    address from, bytes4 functionSignature, FunctionType fType
  ) public {
    // TO DO: Check that msg.sender is a contract ?
    allowedCallbacks[msg.sender][from][functionSignature][uint8(fType)] = false;
  }

  /**
   * @dev Addition to ERC20 token methods. It allows to
   * approve the transfer of value and execute a call with the sent data.
   * Beware that changing an allowance with this method brings the risk that
   * someone may use both the old and the new allowance by unfortunate
   * transaction ordering. One possible solution to mitigate this race condition
   * is to first reduce the spender's allowance to 0 and set the desired value
   * afterwards:
   * https://github.com/ethereum/EIPs/issues/20#issuecomment-263524729
   * @param _spender The address that will spend the funds.
   * @param _value The amount of tokens to be spent.
   * @param _data ABI-encoded contract call to call `_spender` address.
   * @return true if the call function was executed successfully
   */
  function approveAndCall(address _spender, uint256 _value, bytes _data)
    public payable callbackAllowed(_spender, _data, FunctionType.Approve)
    returns (bool)
  {
    require(_spender != address(this));

    super.approve(_spender, _value);

    // solium-disable-next-line security/no-call-value
    require(_spender.call.value(msg.value)(_data));

    return true;
  }

  /**
   * @dev Addition to ERC20 token methods. Transfer tokens to a specified
   * address and execute a call with the sent data on the same transaction
   * @param _to address The address which you want to transfer to
   * @param _value uint256 the amout of tokens to be transfered
   * @param _data ABI-encoded contract call to call `_to` address.
   * @return true if the call function was executed successfully
   */
  function transferAndCall(address _to, uint256 _value, bytes _data)
    public payable callbackAllowed(_to, _data, FunctionType.Transfer)
    returns (bool)
  {
    require(_to != address(this));

    super.transfer(_to, _value);

    // solium-disable-next-line security/no-call-value
    require(_to.call.value(msg.value)(_data));
    return true;
  }

  /**
   * @dev Addition to ERC20 token methods. Transfer tokens from one address to
   * another and make a contract call on the same transaction
   * @param _from The address which you want to send tokens from
   * @param _to The address which you want to transfer to
   * @param _value The amout of tokens to be transferred
   * @param _data ABI-encoded contract call to call `_to` address.
   * @return true if the call function was executed successfully
   */
  function transferFromAndCall(
    address _from, address _to, uint256 _value, bytes _data
  ) public payable callbackAllowed(_to, _data, FunctionType.TransferFrom)
    returns (bool)
  {
    require(_to != address(this));

    super.transferFrom(_from, _to, _value);

    // solium-disable-next-line security/no-call-value
    require(_to.call.value(msg.value)(_data));

    return true;
  }

  /**
   * @dev Receives true or false depending if the callback can be executed
   * @param from address The address that can execute the callback
   * @param to address The address where teh callback will be executed
   * @param functionSignature bytes4 The signature of the callback function
   * @param functionType FunctionType The type of the function
   */
  function isCallbackAllowed(
    address from,
    address to,
    bytes4 functionSignature,
    FunctionType functionType
  ) public view returns(bool) {
    uint8 fType = uint8(functionType);
    return(
      allowedCallbacks[to][address(0)][bytes4(0)][fType] ||
      allowedCallbacks[to][address(0)][functionSignature][fType] ||
      allowedCallbacks[to][from][functionSignature][fType]
    );
  }

}

// mock class using ERC827 Token
contract ERC827TokenMockAllowedCallbacks is ERC827TokenAllowedCallbacks {

  constructor(address initialAccount, uint256 initialBalance) public {
    balances[initialAccount] = initialBalance;
    totalSupply_ = initialBalance;
  }

}
