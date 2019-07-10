
import EVMRevert from '../helpers/EVMRevert';
const ERC827Mock = artifacts.require('ERC827Mock');
const ERC827Receiver = artifacts.require('ERC827Receiver');
const ERC827Proxy = artifacts.require('ERC827Proxy');

require('chai')
  .use(require('chai-as-promised'))
  .should();

contract('ERC827Receiver', function ([sender, otherAccount]) {
  let token, receiverContract;

  beforeEach(async function () {
    token = await ERC827Mock.new(sender, 100, ERC827Proxy.bytecode);
    receiverContract = await ERC827Receiver.new();
    receiverContract.web3Instance = new web3.eth.Contract(ERC827Receiver.abi, receiverContract.address);
  });

  it('should claim the tokens from sender', async function () {
    const callReceiverData = receiverContract.web3Instance.methods
      .receiveTokens(sender, token.address).encodeABI();
    await token.approveAndCall(receiverContract.address, 100, callReceiverData, { from: sender });

    assert.equal(await token.balanceOf(sender), 0);
    assert.equal(await token.balanceOf(receiverContract.address), 100);
  });

  it('should claim the tokens from the verified sender', async function () {
    const callReceiverData = receiverContract.web3Instance.methods
      .receiveVerifiedTokens(sender, token.address).encodeABI();
    await token.approveAndCall(receiverContract.address, 100, callReceiverData, { from: sender });

    assert.equal(await token.balanceOf(sender), 0);
    assert.equal(await token.balanceOf(receiverContract.address), 100);
  });

  it('should fail when executing verifiedTransfer from external accounts', async function () {
    const callReceiverData = receiverContract.web3Instance.methods
      .receiveVerifiedTokens(sender, token.address).encodeABI();
    await token.approve(receiverContract.address, 100, { from: sender });

    // Trying to execute transferFrom on receiver contract over sender balance form other account
    await receiverContract.receiveVerifiedTokens(sender, token.address, { from: otherAccount })
      .should.be.rejectedWith(EVMRevert);

    // Trying to execute transferFrom on receiver contract over sender balance form sender account
    await receiverContract.receiveVerifiedTokens(sender, token.address, { from: sender })
      .should.be.rejectedWith(EVMRevert);


    assert.equal(await token.balanceOf(sender), 100);
    assert.equal(await token.balanceOf(otherAccount), 0);
    assert.equal(await token.balanceOf(receiverContract.address), 0);
  });
});
