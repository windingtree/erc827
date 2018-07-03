
import EVMRevert from '../helpers/EVMRevert';
var Message = artifacts.require('./mocks/MessageHelper');
var ERC827TokenMock = artifacts.require('./ERC827/proposals/ERC827TokenMockAllowedCallbacks');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC827 Token proposal with allowed callbacks', function (accounts) {
  let token;

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
  });

  it('should allow execution of ERC827 tranfer on receiver that allows a function from a specific address', async function () {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');

    let signature = data.substring(0, 10);

    assert.equal(false,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let allowCallbackData = token.contract.allowCallback.getData(accounts[0], signature);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, signature, data
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows a function from any address', async function () {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');

    let signature = data.substring(0, 10);

    assert.equal(false,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let allowCallbackData = token.contract.allowCallback.getData(0x0, signature);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, signature, data
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows any function from any address', async function () {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');

    let signature = data.substring(0, 10);

    assert.equal(false,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, signature)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, signature, data
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('Should fail when trying to execute not allowed function on receiver contract', async function () {
    let message = await Message.new();

    let data = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');

    let signature = data.substring(0, 10);

    let transaction = await token.transferAndCall(
      message.contract.address, 100, signature, data
    ).should.be.rejectedWith(EVMRevert);

    assert.equal(100, await token.balanceOf(accounts[0]));
  });
});
