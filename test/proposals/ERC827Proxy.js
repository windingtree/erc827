
import EVMRevert from '../helpers/EVMRevert';
var Message = artifacts.require('./mocks/MessageHelper');
var ERC827TokenMock = artifacts.require('./ERC827/proposals/ERC827TokenMockAllowedCallbacks');
var ERC827Proxy = artifacts.require('./ERC827/proposals/ERC827Proxy');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC827 Proxy for allowed callbacks', function (accounts) {
  let token, message, messageData, functionSignature;

  before(async function () {
    message = await Message.new();
    messageData = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');
    functionSignature = messageData.substring(0, 10);
  });

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
  });

  it('should forward token balance correctly with ERC827Proxy', async function () {
    let proxy = await ERC827Proxy.new(token.address);

    let makeCallData = proxy.contract.makeCall.getData(message.address, messageData);
    let makeCallSig = makeCallData.substring(0, 10);

    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], proxy.address, makeCallSig, 1)
    );
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], proxy.address, makeCallSig, 2)
    );
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], proxy.address, makeCallSig, 3)
    );

    await token.transferAndCall(
      proxy.address, 100, makeCallData
    );

    assert.equal(100, await token.balanceOf(message.address));
    assert.equal(0, await token.balanceOf(proxy.address));
    assert.equal(0, await token.balanceOf(accounts[0]));
  });

});
