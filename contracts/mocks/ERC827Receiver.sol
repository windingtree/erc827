pragma solidity ^0.5.0;

import "../ERC827/ERC827.sol";
import "../utils/Create2.sol";

contract ERC827Receiver {

  event Show(bytes32 b32, uint256 number, string text, uint256 value);
  event TokensTransfered(address from, uint256 amount);

  function showMessage(bytes32 message, uint256 number, string memory text)
    public payable returns (bool)
  {
    emit Show(message, number, text, msg.value);
    return true;
  }

  function fail() public {
    revert("ERC827Receiver function failed");
  }

  function callContarct(address to, bytes memory data) public returns (bool) {
    // solium-disable-next-line security/no-low-level-calls, no-unused-vars
    (bool success, bytes memory _data) = to.call(data);
    require(success, "ERC827Receiver callContarct function failed");
    return true;
  }

  function receiveTokens(address sender, address token) public {
    uint256 allowance = ERC827(token).allowance(sender, address(this));
    ERC827(token).transferFrom(sender, address(this), allowance);
    emit TokensTransfered(sender, allowance);
  }

  function receiveVerifiedTokens(address sender, ERC827 token) public {
    address proxy = Create2.computeAddress(
      address(token),
      keccak256(abi.encodePacked(sender, address(this), token.nonces(sender))),
      token.proxyBytecode()
    );
    require(msg.sender == proxy, "ERC827Receiver: Sender invalid");
    uint256 allowance = ERC827(token).allowance(sender, address(this));
    ERC827(token).transferFrom(sender, address(this), allowance);
    emit TokensTransfered(sender, allowance);
  }

}
