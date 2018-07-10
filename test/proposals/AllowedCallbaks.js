
import EVMRevert from '../helpers/EVMRevert';
var Message = artifacts.require('./mocks/MessageHelper');
var ERC827TokenMock = artifacts.require('./ERC827/proposals/ERC827TokenMockAllowedCallbacks');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ERC827 Token proposal with allowed callbacks', function (accounts) {
  let token, message, messageData, functionSignature;

  before(async function () {
    message = await Message.new();
    messageData = message.contract.showMessage.getData(web3.toHex(123456), 666, 'Transfer Done');
    functionSignature = messageData.substring(0, 10);
  });

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
  });

  it('should allow execution of ERC827 tranfer on receiver that allows a function from a specific address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(accounts[0], functionSignature, 2);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    await token.transferAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows a function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 2);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    await token.transferAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows any function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 2);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    await token.transferAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows a function from a specific address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(accounts[0], functionSignature, 1);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    await token.approveAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows a function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 1);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    await token.approveAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows any function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 1);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    await token.approveAndCall(
      message.address, 100, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows a function from a specific address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(accounts[1], functionSignature, 3);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    await token.transferFromAndCall(
      accounts[0], message.address, 100, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows a function from any address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 3);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    await token.transferFromAndCall(
      accounts[0], message.address, 100, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows any function from any address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 3);

    await message.call(token.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    await token.transferFromAndCall(
      accounts[0], message.address, 100, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.address));
  });

  it('should fail execution of ERC827 tranferFrom when only approval and transfer are allowed for that function', async function () {
    let message2 = await Message.new();

    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 1);
    await message.call(token.address, allowCallbackData);

    allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 2);
    await message.call(token.address, allowCallbackData);

    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );
    assert.equal(false,
      await token.isCallbackAllowed(message.address, message2.address, functionSignature, 3)
    );

    await token.approveAndCall(message.address, 100, messageData);

    let transferFromAndCallData = token.contract.transferFromAndCall.getData(
      accounts[0], message2.address, 100, messageData
    );
    await message.call(token.address, transferFromAndCallData)
      .should.be.rejectedWith(EVMRevert);

    assert.equal(100, await token.balanceOf(accounts[0]));
  });

  it('Should fail when trying to execute not allowed function on receiver contract', async function () {
    await token.transferAndCall(
      message.address, 100, messageData
    ).should.be.rejectedWith(EVMRevert);

    assert.equal(100, await token.balanceOf(accounts[0]));
  });
});
