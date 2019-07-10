
import EVMRevert from '../helpers/EVMRevert';
const ERC827Mock = artifacts.require('ERC827Mock');
const ERC20Mock = artifacts.require('ERC20Mock');
const ERC827Proxy = artifacts.require('ERC827Proxy');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('ClaimOtherTokensAttack', function ([attacker, victim]) {
  let erc827, erc20;

  beforeEach(async function () {
    erc827 = await ERC827Mock.new(attacker, 100, ERC827Proxy.bytecode);
    erc20 = await ERC20Mock.new(victim, 100);
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
