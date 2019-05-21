
import EVMRevert from '../helpers/EVMRevert';
var Message = artifacts.require('MessageHelper');
var ERC827TokenMock = artifacts.require('ERC827Mock');

require('chai').use(require('chai-as-promised')).should();
const assert = require('chai').assert;

contract('ERC827 Token', function (accounts) {
  let token, message;

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
    token.web3Instance = new web3.eth.Contract(token.abi, token.address);
    message = await Message.new();
    message.web3Instance = new web3.eth.Contract(message.abi, message.address);
  });

  it('should return the correct totalSupply after construction', async function () {
    let totalSupply = await token.totalSupply();
    assert.equal(totalSupply, 100);
  });

  it('should return the correct allowance amount after approval', async function () {
    let token = await ERC827TokenMock.new(accounts[0], 100);
    await token.approve(accounts[1], 100);
    let allowance = await token.allowance(accounts[0], accounts[1]);
    assert.equal(allowance, 100);
  });

  it('should return correct balances after transfer', async function () {
    await token.transfer(accounts[1], 100);
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    let balance1 = await token.balanceOf(accounts[1]);
    assert.equal(balance1, 100);
  });

  it('should throw an error when trying to transfer more than balance', async function () {
    await token.transfer(accounts[1], 101).should.be.rejectedWith(EVMRevert);
  });

  it('should return correct balances after transfering from another account', async function () {
    await token.approve(accounts[1], 100);
    await token.transferFrom(accounts[0], accounts[2], 100, { from: accounts[1] });
    let balance0 = await token.balanceOf(accounts[0]);
    assert.equal(balance0, 0);
    let balance1 = await token.balanceOf(accounts[2]);
    assert.equal(balance1, 100);
    let balance2 = await token.balanceOf(accounts[1]);
    assert.equal(balance2, 0);
  });

  it('should throw an error when trying to transfer more than allowed', async function () {
    await token.approve(accounts[1], 99);
    await token.transferFrom(
      accounts[0], accounts[2], 100,
      { from: accounts[1] }
    ).should.be.rejectedWith(EVMRevert);
  });

  it('should throw an error when trying to transferFrom more than _from has', async function () {
    let balance0 = await token.balanceOf(accounts[0]);
    await token.approve(accounts[1], 99);
    await token.transferFrom(
      accounts[0], accounts[2], balance0 + 1,
      { from: accounts[1] }
    ).should.be.rejectedWith(EVMRevert);
  });

  describe('validating allowance updates to spender', function () {
    it('should start with zero', async function () {
      assert.equal(await token.allowance(accounts[0], accounts[1]), 0);
    });

    it('should increase by 50 then decrease by 10', async function () {
      await token.increaseAllowance(accounts[1], 50);
      assert.equal(await token.allowance(accounts[0], accounts[1]), 50);
      await token.decreaseAllowance(accounts[1], 10);
      assert.equal(await token.allowance(accounts[0], accounts[1]), 40);
    });
  });

  describe('Test ERC827 methods', function () {
    it(
      'should allow payment through transfer'
      , async function () {
        const extraData = message.web3Instance.methods.buyMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        const transaction = await token.transferAndCall(
          message.address, 100, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.rawLogs.length);

        assert.equal(await token.balanceOf(message.address), 100);
        assert.equal(await web3.eth.getBalance(message.address), 1000);
      });

    it(
      'should allow payment through approve'
      , async function () {
        const extraData = message.web3Instance.methods.buyMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        const transaction = await token.approveAndCall(
          message.address, 100, extraData, { from: accounts[0], value: 1000 }
        );

        assert.equal(2, transaction.receipt.rawLogs.length);

        assert.equal(await token.allowance(accounts[0], message.address), 100);
        assert.equal(await web3.eth.getBalance(message.address), 1000);
      });

    it(
      'should allow payment through transferFrom'
      , async function () {
        const extraData = message.web3Instance.methods.buyMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        await token.approve(accounts[1], 100, { from: accounts[0] });

        assert.equal(await token.allowance(accounts[0], accounts[1]), 100);

        const transaction = await token.transferFromAndCall(
          accounts[0], message.address, 100, extraData, { from: accounts[1], value: 1000 }
        );

        assert.equal(2, transaction.receipt.logs.length);

        assert.equal(
          await token.balanceOf(message.address), 100
        );
        assert.equal(
          await web3.eth.getBalance(message.address), 1000
        );
      });

    it('should revert funds of failure inside approve (with data)', async function () {
      const extraData = message.web3Instance.methods.showMessage(
        web3.utils.toHex(123456), 666, 'Transfer Done'
      ).encodeABI();

      await token.approveAndCall(
        message.address, 10, extraData, { from: accounts[0], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // approval should not have gone through so allowance is still 0
      assert.equal(await token.allowance(accounts[1], message.address), 0);
      assert.equal(await web3.eth.getBalance(message.address), 0);
    });

    it('should revert funds of failure inside transfer (with data)', async function () {
      const extraData = message.web3Instance.methods.showMessage(
        web3.utils.toHex(123456), 666, 'Transfer Done'
      ).encodeABI();

      await token.transferAndCall(
        message.address, 10, extraData, { from: accounts[0], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // transfer should not have gone through, so balance is still 0
      assert.equal(await token.balanceOf(message.address), 0);
      assert.equal(await web3.eth.getBalance(message.address), 0);
    });

    it('should revert funds of failure inside transferFrom (with data)', async function () {
      const extraData = message.web3Instance.methods.showMessage(
        web3.utils.toHex(123456), 666, 'Transfer Done'
      ).encodeABI();

      await token.approve(accounts[1], 10, { from: accounts[2] });

      await token.transferFromAndCall(
        accounts[2], message.address, 10, extraData, { from: accounts[2], value: 1000 }
      ).should.be.rejectedWith(EVMRevert);

      // transferFrom should have failed so balance is still 0 but allowance is 10
      assert.equal(await token.allowance(accounts[2], accounts[1]), 10);
      assert.equal(await token.balanceOf(message.address), 0);
      assert.equal(await web3.eth.getBalance(message.address), 0);
    });

    it(
      'should return correct balances after transfer (with data) and show the event on receiver contract'
      , async function () {
        const extraData = message.web3Instance.methods.showMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        const transaction = await token.transferAndCall(message.address, 100, extraData);

        assert.equal(2, transaction.receipt.rawLogs.length);

        assert.equal(await token.balanceOf(message.address), 100);
      });

    it(
      'should return correct allowance after approve (with data) and show the event on receiver contract'
      , async function () {
        const extraData = message.web3Instance.methods.showMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        const transaction = await token.approveAndCall(message.address, 100, extraData);

        assert.equal(2, transaction.receipt.rawLogs.length);

        assert.equal(await token.allowance(accounts[0], message.address), 100);
      });

    it(
      'should return correct balances after transferFrom (with data) and show the event on receiver contract'
      , async function () {
        const extraData = message.web3Instance.methods.showMessage(
          web3.utils.toHex(123456), 666, 'Transfer Done'
        ).encodeABI();

        await token.approve(accounts[1], 100, { from: accounts[0] });

        assert.equal(await token.allowance(accounts[0], accounts[1]), 100);

        const transaction = await token.transferFromAndCall(accounts[0], message.address, 100, extraData, {
          from: accounts[1],
        });

        assert.equal(2, transaction.receipt.logs.length);

        assert.equal(await token.balanceOf(message.address), 100);
      });

    it('should fail inside approve (with data)', async function () {
      const extraData = message.web3Instance.methods.fail().encodeABI();

      await token.approveAndCall(message.address, 10, extraData)
        .should.be.rejectedWith(EVMRevert);

      // approval should not have gone through so allowance is still 0
      assert.equal(await token.allowance(accounts[1], message.address), 0);
    });

    it('should fail inside transfer (with data)', async function () {
      const extraData = message.web3Instance.methods.fail().encodeABI();

      await token.transferAndCall(message.address, 10, extraData)
        .should.be.rejectedWith(EVMRevert);

      // transfer should not have gone through, so balance is still 0
      assert.equal(await token.balanceOf(message.address), 0);
    });

    it('should fail inside transferFrom (with data)', async function () {
      const extraData = message.web3Instance.methods.fail().encodeABI();

      await token.approve(accounts[1], 10, { from: accounts[2] });
      await token.transferFromAndCall(accounts[2], message.address, 10, extraData, { from: accounts[1] })
        .should.be.rejectedWith(EVMRevert);

      // transferFrom should have failed so balance is still 0 but allowance is 10
      assert.equal(await token.allowance(accounts[2], accounts[1]), 10);
      assert.equal(await token.balanceOf(message.address), 0);
    });

    it('should fail approve (with data) when using token contract address as receiver', async function () {
      const extraData = message.web3Instance.methods.fail().encodeABI();

      await token.approveAndCall(token.address, 100, extraData, { from: accounts[0] })
        .should.be.rejectedWith(EVMRevert);
    });

    it('should fail transfer (with data) when using token contract address as receiver', async function () {
      const extraData = message.web3Instance.methods.showMessage(
        web3.utils.toHex(123456), 666, 'Transfer Done'
      ).encodeABI();

      await token.transferAndCall(token.address, 100, extraData)
        .should.be.rejectedWith(EVMRevert);
    });

    it('should fail transferFrom (with data) when using token contract address as receiver', async function () {
      const extraData = message.web3Instance.methods.showMessage(
        web3.utils.toHex(123456), 666, 'Transfer Done'
      ).encodeABI();

      await token.approve(accounts[1], 1, { from: accounts[0] });

      await token.transferFromAndCall(accounts[0], token.address, 1, extraData, { from: accounts[1] })
        .should.be.rejectedWith(EVMRevert);
    });
  });
});
