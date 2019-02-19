
import EVMRevert from '../helpers/EVMRevert';
var ERC827TokenMock = artifacts.require('ERC827TokenMock');
var ERC20TokenMock = artifacts.require('ERC20TokenMock');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('ClaimOtherTokensAttack', function ([attacker, victim]) {
  let erc827, erc20;

  beforeEach(async function () {
    erc827 = await ERC827TokenMock.new(attacker, 100);
    erc20 = await ERC20TokenMock.new(victim, 100);
    erc20.web3Instance = new web3.eth.Contract(erc20.abi, erc20.address);
  });

  it('should be able to take ERC20 tokens in ERC827 contract', async function () {
    await erc20.approve(erc827.address, 50, { from: victim });
    await erc20.transfer(erc827.address, 50, { from: victim });

    const getTokenBalanceData = erc20.web3Instance.methods.transfer(attacker, 50).encodeABI();
    await erc827.transferAndCall(erc20.address, 0, getTokenBalanceData, { from: attacker })
      .should.be.rejectedWith(EVMRevert);

    const claimApprovedBalanceData = erc20.web3Instance.methods.transferFrom(victim, attacker, 50).encodeABI;
    await erc827.transferAndCall(erc20.address, 0, claimApprovedBalanceData, { from: attacker })
      .should.be.rejectedWith(EVMRevert);

    // If attack succeds victim would have 0 and attacker 100 of erc20 tokens
    assert.equal(await erc20.balanceOf(victim), 50);
    assert.equal(await erc20.balanceOf(attacker), 0);
  });
});
