
import EVMRevert from '../helpers/EVMRevert';
var Message = artifacts.require('MessageHelper');
var ERC827TokenMock = artifacts.require('ERC827TokenMock');
var ERC20TokenMock = artifacts.require('ERC20TokenMock');

var BigNumber = web3.BigNumber;
require('chai')
  .use(require('chai-as-promised'))
  .use(require('chai-bignumber')(BigNumber))
  .should();

contract('ClaimOtherTokensAttack', function (accounts) {
  let erc827, erc20;

  beforeEach(async function () {
    erc827 = await ERC827TokenMock.new(accounts[0], 100);
    erc20 = await ERC20TokenMock.new(accounts[1], 100);
  });

  it('should not be able to take ERC20 tokens in ERC827 contract', async function () {
    await erc20.approve(erc827.address, 50, {from: accounts[1]});
    await erc20.transfer(erc827.address, 50, {from: accounts[1]});

    (await erc20.balanceOf(accounts[1])).should.be.bignumber.equal(50);
    (await erc20.balanceOf(accounts[0])).should.be.bignumber.equal(0);

    const getTokenBalanceData = erc20.contract.transfer
      .getData(accounts[0], 50);
    await erc827.transferAndCall(erc20.address, 0, getTokenBalanceData, {from: accounts[0]}).should.be.rejectedWith(EVMRevert);

    (await erc20.balanceOf(accounts[1])).should.be.bignumber.equal(50);
    (await erc20.balanceOf(accounts[0])).should.be.bignumber.equal(0);

    const claimApprovedBalanceData = erc20.contract.transferFrom
      .getData(accounts[1], accounts[0], 50);
    await erc827.transferAndCall(erc20.address, 0, claimApprovedBalanceData, {from: accounts[0]}).should.be.rejectedWith(EVMRevert);

    (await erc20.balanceOf(accounts[1])).should.be.bignumber.equal(50);
    (await erc20.balanceOf(accounts[0])).should.be.bignumber.equal(0);
  });

});
