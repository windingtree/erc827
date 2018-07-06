
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

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows a function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 2);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranfer on receiver that allows any function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 2);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 2)
    );

    let transaction = await token.transferAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows a function from a specific address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(accounts[0], functionSignature, 1);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    let transaction = await token.approveAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.contract.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows a function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 1);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    let transaction = await token.approveAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.contract.address));
  });

  it('should allow execution of ERC827 approve on receiver that allows any function from any address', async function () {
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 1);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[0], message.address, functionSignature, 1)
    );

    let transaction = await token.approveAndCall(
      message.contract.address, 100, functionSignature, messageData
    );

    assert.equal(100, await token.allowance(accounts[0], message.contract.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows a function from a specific address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(accounts[1], functionSignature, 3);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    let transaction = await token.transferFromAndCall(
      accounts[0], message.contract.address, 100, functionSignature, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows a function from any address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(0x0, functionSignature, 3);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    let transaction = await token.transferFromAndCall(
      accounts[0], message.contract.address, 100, functionSignature, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('should allow execution of ERC827 tranferFrom on receiver that allows any function from any address', async function () {
    await token.approve(accounts[1], 100);
    let allowCallbackData = token.contract.allowCallback.getData(0x0, 0x0, 3);

    await message.call(token.contract.address, allowCallbackData);
    assert.equal(true,
      await token.isCallbackAllowed(accounts[1], message.address, functionSignature, 3)
    );

    let transaction = await token.transferFromAndCall(
      accounts[0], message.contract.address, 100, functionSignature, messageData,
      {from: accounts[1]}
    );

    assert.equal(100, await token.balanceOf(message.contract.address));
  });

  it('Should fail when trying to execute not allowed function on receiver contract', async function () {
    let transaction = await token.transferAndCall(
      message.contract.address, 100, functionSignature, messageData
    ).should.be.rejectedWith(EVMRevert);

    assert.equal(100, await token.balanceOf(accounts[0]));
  });
});
