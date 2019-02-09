const UNDToken = artifacts.require("./UNDToken.sol");
require('dotenv').config()

module.exports = function(deployer) {
    deployer.deploy(UNDToken,
                    process.env.TOKEN_NAME,
                    process.env.TOKEN_SYM,
                    process.env.TOKEN_DECIMALS,
                    process.env.NUM_TOKENS,
                    process.env.INITIAL_WALLET
                    );
};
