const { BN, constants, expectEvent, shouldFail } = require('openzeppelin-test-helpers');
const { ZERO_ADDRESS } = constants;

const UNDToken = artifacts.require('UNDToken');

contract('UNDToken', function ([_, initialHolder, recipient, anotherAccount]) {

  const _name = "United Network Distribution";
  const _symbol = "UND";
  const _decimals = 18;
  const _supply = 1000000000;

  //UNDToken contract calculates "Wei" value during construction to get the
  //amount to initially mint: uint256 toMint = _amount.mul(10 ** uint256(_decimals));
  //UND has 18 decimals, same as ETH, so can use toWei.
  //initialSupply needs to be in Wei for assertions, so calculate it here
  const initialSupply = web3.utils.toWei(new BN(_supply));

  beforeEach(async function () {
    this.token = await UNDToken.new(_name, _symbol, _decimals, _supply, initialHolder);
  });

  describe('token details', function () {
    it('has a name', async function () {
      (await this.token.name()).should.be.equal(_name);
    });

    it('has a symbol', async function () {
      (await this.token.symbol()).should.be.equal(_symbol);
    });

    it('has an amount of decimals', async function () {
      (await this.token.decimals()).should.be.bignumber.equal(new BN(_decimals));
    });
  });

  describe('total supply', function () {
    it('returns the total amount of tokens', async function () {
      (await this.token.totalSupply()).should.be.bignumber.equal(initialSupply);
    });
  });

  describe('balanceOf', function () {
    describe('when the requested account has no tokens', function () {
      it('returns zero', async function () {
        (await this.token.balanceOf(anotherAccount)).should.be.bignumber.equal('0');
      });
    });

    describe('when the requested account has some tokens', function () {
      it('returns the total amount of tokens', async function () {
        (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal(initialSupply);
      });
    });
  });

  describe('transfer', function () {
    describe('when the recipient is not the zero address', function () {
      const to = recipient;

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        it('reverts', async function () {
          await shouldFail.reverting(this.token.transfer(to, amount, { from: initialHolder }));
        });
      });

      describe('when the sender has enough balance', function () {
        const amount = initialSupply;

        it('transfers the requested amount', async function () {
          await this.token.transfer(to, amount, { from: initialHolder });

          (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('0');

          (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
        });

        it('emits a transfer event', async function () {
          const { logs } = await this.token.transfer(to, amount, { from: initialHolder });

          expectEvent.inLogs(logs, 'Transfer', {
            from: initialHolder,
            to: to,
            value: amount,
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const to = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transfer(to, initialSupply, { from: initialHolder }));
      });
    });
  });

  describe('transfer from', function () {
    const spender = recipient;

    describe('when the recipient is not the zero address', function () {
      const to = anotherAccount;

      describe('when the spender has enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, initialSupply, { from: initialHolder });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = initialSupply;

          it('transfers the requested amount', async function () {
            await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            (await this.token.balanceOf(initialHolder)).should.be.bignumber.equal('0');

            (await this.token.balanceOf(to)).should.be.bignumber.equal(amount);
          });

          it('decreases the spender allowance', async function () {
            await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('0');
          });

          it('emits a transfer event', async function () {
            const { logs } = await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Transfer', {
              from: initialHolder,
              to: to,
              value: amount,
            });
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.transferFrom(initialHolder, to, amount, { from: spender });

            expectEvent.inLogs(logs, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: await this.token.allowance(initialHolder, spender),
            });
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = initialSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(initialHolder, to, amount, { from: spender }));
          });
        });
      });

      describe('when the spender does not have enough approved balance', function () {
        beforeEach(async function () {
          await this.token.approve(spender, initialSupply.subn(1), { from: initialHolder });
        });

        describe('when the initial holder has enough balance', function () {
          const amount = initialSupply;

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(initialHolder, to, amount, { from: spender }));
          });
        });

        describe('when the initial holder does not have enough balance', function () {
          const amount = initialSupply.addn(1);

          it('reverts', async function () {
            await shouldFail.reverting(this.token.transferFrom(initialHolder, to, amount, { from: spender }));
          });
        });
      });
    });

    describe('when the recipient is the zero address', function () {
      const amount = initialSupply;
      const to = ZERO_ADDRESS;

      beforeEach(async function () {
        await this.token.approve(spender, amount, { from: initialHolder });
      });

      it('reverts', async function () {
        await shouldFail.reverting(this.token.transferFrom(initialHolder, to, amount, { from: spender }));
      });
    });
  });

  describe('decrease allowance', function () {
    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      function shouldDecreaseApproval (amount) {
        describe('when there was no approved amount before', function () {
          it('reverts', async function () {
            await shouldFail.reverting(this.token.decreaseAllowance(spender, amount, { from: initialHolder }));
          });
        });

        describe('when the spender had an approved amount', function () {
          const approvedAmount = amount;

          beforeEach(async function () {
            ({ logs: this.logs } = await this.token.approve(spender, approvedAmount, { from: initialHolder }));
          });

          it('emits an approval event', async function () {
            const { logs } = await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });

            expectEvent.inLogs(logs, 'Approval', {
              owner: initialHolder,
              spender: spender,
              value: new BN(0),
            });
          });

          it('decreases the spender allowance subtracting the requested amount', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount.subn(1), { from: initialHolder });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('1');
          });

          it('sets the allowance to zero when all allowance is removed', async function () {
            await this.token.decreaseAllowance(spender, approvedAmount, { from: initialHolder });
            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal('0');
          });

          it('reverts when more than the full allowance is removed', async function () {
            await shouldFail.reverting(
              this.token.decreaseAllowance(spender, approvedAmount.addn(1), { from: initialHolder })
            );
          });
        });
      }

      describe('when the sender has enough balance', function () {
        const amount = initialSupply;

        shouldDecreaseApproval(amount);
      });

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        shouldDecreaseApproval(amount);
      });
    });

    describe('when the spender is the zero address', function () {
      const amount = initialSupply;
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.decreaseAllowance(spender, amount, { from: initialHolder }));
      });
    });
  });

  describe('increase allowance', function () {
    const amount = initialSupply;

    describe('when the spender is not the zero address', function () {
      const spender = recipient;

      describe('when the sender has enough balance', function () {
        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

          expectEvent.inLogs(logs, 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount.addn(1));
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = initialSupply.addn(1);

        it('emits an approval event', async function () {
          const { logs } = await this.token.increaseAllowance(spender, amount, { from: initialHolder });

          expectEvent.inLogs(logs, 'Approval', {
            owner: initialHolder,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await this.token.approve(spender, new BN(1), { from: initialHolder });
          });

          it('increases the spender allowance adding the requested amount', async function () {
            await this.token.increaseAllowance(spender, amount, { from: initialHolder });

            (await this.token.allowance(initialHolder, spender)).should.be.bignumber.equal(amount.addn(1));
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      const spender = ZERO_ADDRESS;

      it('reverts', async function () {
        await shouldFail.reverting(this.token.increaseAllowance(spender, amount, { from: initialHolder }));
      });
    });
  });

  describe('approve', function () {
    testApprove(initialHolder, recipient, initialSupply, function (owner, spender, amount) {
      return this.token.approve(spender, amount, { from: owner });
    });
  });

  describe('internal functions not callable', function () {

    describe('cannot mint new tokens after deployment using internal function', function () {

      const amount = new BN(100);

      it('call _mint fails', async function () {
        try{
          this.token._mint(initialHolder, amount);
        } catch(e) {
          assert.equal(e.message, "this.token._mint is not a function");
        }
      });
    });

    describe('cannot burn tokens using internal function', function () {

      const amount = new BN(1);

      it('call _burn fails', async function () {
        try{
          this.token._burn(initialHolder, amount);
        } catch(e) {
          assert.equal(e.message, "this.token._burn is not a function");
        }
      });

      it('call _burnFrom fails', async function () {
        try{
          this.token._burnFrom(initialHolder, amount);
        } catch(e) {
          assert.equal(e.message, "this.token._burnFrom is not a function");
        }
      });
    });

    describe('cannot call _transfer internal function', function () {

      const amount = new BN(100);

      it('call _transfer fails', async function () {
        try{
          this.token._transfer(initialHolder, recipient, amount);
        } catch(e) {
          assert.equal(e.message, "this.token._transfer is not a function");
        }
      });
    });
  });

  function testApprove (owner, spender, supply, approve) {
    describe('when the spender is not the zero address', function () {
      describe('when the sender has enough balance', function () {
        const amount = supply;

        it('emits an approval event', async function () {
          const { logs } = await approve.call(this, owner, spender, amount);

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await approve.call(this, owner, spender, new BN(1));
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });

      describe('when the sender does not have enough balance', function () {
        const amount = supply.addn(1);

        it('emits an approval event', async function () {
          const { logs } = await approve.call(this, owner, spender, amount);

          expectEvent.inLogs(logs, 'Approval', {
            owner: owner,
            spender: spender,
            value: amount,
          });
        });

        describe('when there was no approved amount before', function () {
          it('approves the requested amount', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });

        describe('when the spender had an approved amount', function () {
          beforeEach(async function () {
            await approve.call(this, owner, spender, new BN(1));
          });

          it('approves the requested amount and replaces the previous one', async function () {
            await approve.call(this, owner, spender, amount);

            (await this.token.allowance(owner, spender)).should.be.bignumber.equal(amount);
          });
        });
      });
    });

    describe('when the spender is the zero address', function () {
      it('reverts', async function () {
        await shouldFail.reverting(approve.call(this, owner, ZERO_ADDRESS, supply));
      });
    });
  }
});
