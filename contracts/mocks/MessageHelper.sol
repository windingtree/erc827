pragma solidity ^0.5.0;


contract MessageHelper {

  event Show(bytes32 b32, uint256 number, string text);
  event Buy(bytes32 b32, uint256 number, string text, uint256 value);

  function showMessage(bytes32 message, uint256 number, string memory text)
    public returns (bool)
  {
    emit Show(message, number, text);
    return true;
  }

  function buyMessage(bytes32 message, uint256 number, string memory text)
    public payable returns (bool)
  {
    emit Buy(
      message,
      number,
      text,
      msg.value
    );
    return true;
  }

  function fail() public {
    revert("MessageHelper fail function failed");
  }

  function callContarct(address to, bytes memory data) public returns (bool) {
    // solium-disable-next-line security/no-low-level-calls, no-unused-vars
    (bool success, bytes memory _data) = to.call(data);
    require(success, "MessageHelper callContarct function failed");
    return true;
  }

}
