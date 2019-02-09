pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

contract UNDToken is ERC20, ERC20Detailed {
    constructor(
        string memory _name,
        string memory _symbol,
        uint8 _decimals,
        uint256 _amount,
        address _initialWallet
    )
        ERC20Detailed(_name, _symbol, _decimals)
        ERC20()
        public
    {
        require(_amount > 0, "amount has to be greater than 0");
        uint256 toMint = _amount.mul(10 ** uint256(_decimals));
        _mint(_initialWallet, toMint);
    }
}

