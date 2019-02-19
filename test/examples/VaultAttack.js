
import EVMRevert from '../helpers/EVMRevert';
var ERC827TokenMock = artifacts.require('ERC827TokenMock');
var VaultAttack = artifacts.require('VaultAttack');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('VaultAttack', function ([victim, attacker]) {
  let token, vault;

  beforeEach(async function () {
    token = await ERC827TokenMock.new(victim, 100);
    vault = await VaultAttack.new();
    vault.web3Instance = new web3.eth.Contract(vault.abi, vault.address);
  });

  it('should fail trying to take all the tokens in the Vault contract', async function () {
    await token.approve(vault.address, 100);
    await vault.deposit(token.address, 100);

    assert.equal(await vault.getBalance(token.address, victim), 100);

    const attackData = vault.web3Instance.methods
      .tokenFallback(attacker, 100, web3.utils.padRight('0x0', 32)).encodeABI();
    await token.transferAndCall(vault.address, 0, attackData, { from: attacker });

    assert.equal(await vault.getBalance(token.address, attacker), 0);

    await vault.withdraw(token.address, 100, { from: attacker })
      .should.be.rejectedWith(EVMRevert);

    // If attack succeds attacker would have 100, and victim 's vault 0
    assert.equal(await token.balanceOf(attacker), 0);
    assert.equal(await vault.getBalance(token.address, victim), 100);
  });
});
