
import EVMRevert from '../helpers/EVMRevert';
const ERC20Mock = artifacts.require('ERC20Mock');
const ERC827Migratable = artifacts.require('ERC827Migratable');
const ERC827Proxy = artifacts.require('ERC827Proxy');

require('chai').use(require('chai-as-promised')).should();
const assert = require('chai').assert;

contract('ERC827Migratable', function (accounts) {
  let erc20Token, erc827Token;

  beforeEach(async function () {
    erc20Token = await ERC20Mock.new(accounts[1], 100);
    erc827Token = await ERC827Migratable.new(erc20Token.address, ERC827Proxy.bytecode);
    await erc20Token.transfer(accounts[2], 10, { from: accounts[1] });
    await erc20Token.transfer(accounts[3], 20, { from: accounts[1] });
    await erc20Token.transfer(accounts[4], 30, { from: accounts[1] });
  });

  it('should change erc20 balance after opt-in migration', async function () {
    await erc20Token.approve(erc827Token.address, 10, { from: accounts[2] });
    await erc827Token.migrate({ from: accounts[2] });
    await erc20Token.approve(erc827Token.address, 15, { from: accounts[3] });
    await erc827Token.migrate({ from: accounts[3] });

    // Check balances
    assert.equal(await erc20Token.balanceOf(accounts[2]), 0);
    assert.equal(await erc20Token.balanceOf(accounts[3]), 5);
    assert.equal(await erc827Token.balanceOf(accounts[2]), 10);
    assert.equal(await erc827Token.balanceOf(accounts[3]), 15);

    // Check ERC827 total supply
    assert.equal(await erc827Token.totalSupply(), 25);
  });

  it('should change erc20 balance after forced migration', async function () {
    await erc827Token.migrateFrom(accounts[2], { from: accounts[0] });
    await erc827Token.migrateFromMany([accounts[3], accounts[4]], { from: accounts[0] });

    // Check balances
    assert.equal(await erc20Token.balanceOf(accounts[2]), 10);
    assert.equal(await erc827Token.balanceOf(accounts[2]), 10);
    assert.equal(await erc20Token.balanceOf(accounts[3]), 20);
    assert.equal(await erc827Token.balanceOf(accounts[3]), 20);
    assert.equal(await erc20Token.balanceOf(accounts[4]), 30);
    assert.equal(await erc827Token.balanceOf(accounts[4]), 30);

    // Check ERC827 total supply
    assert.equal(await erc827Token.totalSupply(), 60);
  });

  it('should change erc20 balance after opt-in and forced migration', async function () {
    await erc20Token.approve(erc827Token.address, 10, { from: accounts[2] });
    await erc827Token.migrate({ from: accounts[2] });
    await erc20Token.approve(erc827Token.address, 20, { from: accounts[3] });
    await erc827Token.migrate({ from: accounts[3] });

    await erc827Token.migrateFrom(accounts[1], { from: accounts[0] });
    await erc827Token.migrateFrom(accounts[4], { from: accounts[0] });

    // Should revert the migration of already migrated tokens
    await erc827Token.migrateFrom(erc827Token.address, { from: accounts[0] })
      .should.be.rejectedWith(EVMRevert);

    // Check balances
    assert.equal(await erc20Token.balanceOf(accounts[1]), 40);
    assert.equal(await erc20Token.balanceOf(accounts[2]), 0);
    assert.equal(await erc20Token.balanceOf(accounts[3]), 0);
    assert.equal(await erc20Token.balanceOf(accounts[4]), 30);
    assert.equal(await erc827Token.balanceOf(accounts[1]), 40);
    assert.equal(await erc827Token.balanceOf(accounts[2]), 10);
    assert.equal(await erc827Token.balanceOf(accounts[3]), 20);
    assert.equal(await erc827Token.balanceOf(accounts[4]), 30);

    // Check ERC827 total supply
    assert.equal(await erc827Token.totalSupply(), 100);
  });
});
