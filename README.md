# ERC827 Token Standard

# Install

`npm install`

# Test

`npm test`

# ERC20 Migration

The contract [ERC827Migratable](contracts/ERC827/ERC827Migratable.sol) can be used to migrate balances from a ERC20 token.
The migration can be opt-in or forced, enabling the use of the opt-in method will allow users to migrate their balances from the ERC20 token themselves and the forced migration will allow the owner of the ERC827 token to issue the same balance from the ERC20 token to any address.

*Important notes*
- If the contract doesn't support the `_mint` function you have to change it to add the right balance to the `balances` and `totalSupply` variables.
- Allow the owner of the ERC827 contract to use the forced migration only when the ERC20 token is paused or cant execute any more tranfers, if not you will end up with two tokens active and duplicated balances.

## Developer Resources

- ERC827 EIP: https://github.com/ethereum/EIPs/issues/827

- Gitter channel: https://gitter.im/ERC827

- Issue tracker: https://github.com/windingtree/erc827/issues
