const { result } = require("lodash")
const BN = require("bignumber.js")
const { should } = require("chai")

require("chai").use(require("chai-as-promised")).should()

// get contracts 
const Exchange = artifacts.require("./Exchange")
const Token = artifacts.require("./Token")

//decimal places
const tokens = (n) => { return new BN(n * 10 ** 18)}

//ether wei
const ether = (n) => {
    return new web3.utils.BN(
      web3.utils.toWei(n.toString(), 'ether')
    )
}

//rejections
const EVM_REVERT = "VM Exception while processing transaction: revert"
const reject = "ERC20: transfer amount exceeds balance"
const ETHER_ADDRESS = '0x0000000000000000000000000000000000000000'

contract("Exchange", ([deployer, feeAccount, user1, user2]) => {
    let token
    let exchange
    const feePct = 10

    beforeEach(async () => {
        //fetch token from chain
        token = await Token.new()

        //transfers tokens to user1
        token.transfer(user1, tokens(100), {from: deployer})

        //fetch exchange from chain
        exchange = await Exchange.new(feeAccount, feePct)
        
    })

    describe("deployment", async () => {

        it("tracks fee account", async () => {

            const result = await exchange.feeAccount()
            result.should.equal(feeAccount)

        })

        it("tracks fee percent", async () => {
            const result = await exchange.feePct()
            result.toString().should.equal(feePct.toString())

        })
    })
    
    describe('fallback', () => {
        it('reverts when Ether is sent', async () => {
            await exchange.sendTransaction({ value: 1, from: user1 }).should.be.rejectedWith(EVM_REVERT)
        })
    })
/*
    describe('depositing Ether', async () => {
        let result
        let amount
    
        beforeEach(async () => {
          amount = ether(1)
          result = await exchange.depositEther({ from: user1, value: amount})
        })
    
        it('tracks the Ether deposit', async () => {
          const balance = await exchange.tokens(ETHER_ADDRESS, user1)
          balance.toString().should.equal(amount.toString())
        })
    
        it('emits a Deposit event', async () => {
          const log = result.logs[0]
          log.event.should.eq('Deposit')
          const event = log.args
          event.token.should.equal(ETHER_ADDRESS, 'token address is correct')
          event.user.should.equal(user1, 'user address is correct')
          event.amount.toString().should.equal(amount.toString(), 'amount is correct')
          event.balance.toString().should.equal(amount.toString(), 'balance is correct')
        })
    })

    describe('withdrawing Ether', async () => {
        let result
        let amount
    
        beforeEach(async () => {
          // Deposit Ether first
          amount = ether(1)
          await exchange.depositEther({ from: user1, value: amount })
        })
    
        describe('success', async () => {
          beforeEach(async () => {
            // Withdraw Ether
            result = await exchange.withdrawEther(amount, { from: user1 })
          })
    
          it('withdraws Ether funds', async () => {
            const balance = await exchange.tokens(ETHER_ADDRESS, user1)
            balance.toString().should.equal('0')
          })
    
          it('emits a "Withdraw" event', async () => {
            const log = result.logs[0]
            log.event.should.eq('Withdraw')
            const event = log.args
            event.token.should.equal(ETHER_ADDRESS)
            event.user.should.equal(user1)
            event.amount.toString().should.equal(amount.toString())
            event.balance.toString().should.equal('0')
          })
    
        })
    
        describe('failure', async () => {
            it('rejects withdraws for insufficient balances', async () => {
                await exchange.withdrawEther(ether(100), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    })

    describe("depositing tokens", async () => {

        let result
        let amount


        beforeEach(async () => {
            amount = tokens(10)
            await token.transfer( user1, tokens(100), {from: deployer})
            await token.approve(exchange.address, amount, {from: user1})
            result = await exchange.depositToken(token.address, amount, {from: user1})
        })

        describe("success", async () => {
            it("tracks token deposit", async () => {
                let balance 
                balance = await token.balanceOf(exchange.address)
                balance.toString().should.equal(amount.toString())
                balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal(amount.toString())
            })

            it('emits a Deposit event', async () => {
                const log = result.logs[0]
                log.event.should.eq('Deposit')
                const event = log.args
                event.token.should.equal(token.address, 'token address is correct')
                event.user.should.equal(user1, 'user address is correct')
                event.amount.toString().should.equal(amount.toString(), 'amount is correct')
                event.balance.toString().should.equal(amount.toString(), 'balance is correct')
            })
        })

        describe("failure", async () => {
            it('rejects Ether deposits', async() => {
                await exchange.depositToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        
            it('fails when no tokens are approved', async () => {
                // Don't approve any tokens before depositing
                await exchange.depositToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
            
        })
    })

    describe('withdrawing tokens', async () => {
        let result
        let amount
    
        describe('success', async () => {
            beforeEach(async () => {
                // Deposit tokens first
                amount = tokens(10)
                await token.approve(exchange.address, amount, { from: user1 })
                await exchange.depositToken(token.address, amount, { from: user1 })
    
             // Withdraw tokens
                result = await exchange.withdrawToken(token.address, amount, { from: user1 })
            })
    
            it('withdraws token funds', async () => {
                const balance = await exchange.tokens(token.address, user1)
                balance.toString().should.equal('0')
            })
    
            it('emits a "Withdraw" event', async () => {
                const log = result.logs[0]
                log.event.should.eq('Withdraw')
                const event = log.args
                event.token.should.equal(token.address)
                event.user.should.equal(user1)
                event.amount.toString().should.equal(amount.toString())
                event.balance.toString().should.equal('0')
            })
        })
    
        describe('failure', async () => {
            it('rejects Ether withdraws', async () => {
                await exchange.withdrawToken(ETHER_ADDRESS, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
    
            it('fails for insufficient balances', async () => {
                // Attempt to withdraw tokens without depositing any first
                await exchange.withdrawToken(token.address, tokens(10), { from: user1 }).should.be.rejectedWith(EVM_REVERT)
            })
        })
    
        describe('checking balances', async () => {
            beforeEach(async () => {
            exchange.depositEther({ from: user1, value: ether(1) })
            })
    
            it('returns user balance', async () => {
            const result = await exchange.balanceOf(ETHER_ADDRESS, user1)
            result.toString().should.equal(ether(1).toString())
            })
        })
    })

    describe('make order', async () => {
        let result 

        beforeEach(async () => {
            result = await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
        })

        it('tracks the newly created order', async () => {
            const orderCount = await exchange.orderCount()
            orderCount.toString().should.equal("1")
            const order = await exchange.orders('1')
            order.id.toString().should.equal("1")
            order.user.should.equal(user1, "user is correct")
            order.tokenGet.should.equal(token.address, "token get is correct")
            order.amountGet.toString().should.equal(tokens(1).toString(), "amount get is correct")
            order.tokenGive.should.equal(ETHER_ADDRESS, "token give is correct")
            order.amountGive.toString().should.equal(ether(1).toString(), "amount is correct")
            order.timestamp.toString().length.should.be.at.least(1, "timestamp is present")
        })

        it('emits order event', async () => {
            const log = result.logs[0]
            log.event.should.equal("order")
            const event = logs.args
            event.id.toString().should.equal("1")
            event.user.should.equal(user1, "user is correct")
            event.tokenGet.should.equal(token.address, "token get is correct")
            event.amountGet.toString().should.equal(tokens(1).toString(), "amount get is correct")
            event.tokenGive.should.equal(ETHER_ADDRESS, "token give is correct")
            event.amountGive.toString().should.equal(ether(1).toString(), "amount is correct")
            event.timestamp.toString().length.should.be.at.least(1, "timestamp is present")
        })
    })

    describe('order actions', async () => {

        beforeEach(async () =>{
            await exchange.depositEther({from: user1, value: ether(1)})
            await token.transfer(user2, tokens(100), {from: deployer})
            await token.approve(exchange.address, tokens(2), {from: user2})
            await exchange.depositToken(token.address, tokens(2), {from: user2})
            await exchange.makeOrder(token.address, tokens(1), ETHER_ADDRESS, ether(1), {from: user1})
        })

        describe('filling orders', async () => {
            let result

            describe('success', async () => {
                beforeEach(async () => {
                    result - await exchange.fillOrder('1', {from: user2})
                })

                it('executes the trade and charges fees', async () => {
                    let balance
                    balance = await exchange.balanceOf(token.address, user1)
                    balance.toString().should.equal(tokens(1).toString(), "user1 received tokens")
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user2)
                    balance.toString().should.equal(ether(1).toString(), "user2 received ether")
                    balance = await exchange.balanceOf(ETHER_ADDRESS, user1)
                    balance.toString().should.equal("0", 'user1 ether deducted')
                    balance = await exchange.balanceOf(token.address, user2)
                    balance.toString().should.equal(tokens(0.9).toString(), "user2 tokens deducted with fee")
                    const feeAccount = await exchange.feeAccount()
                    balance = await exchange.balanceOf(token.address, feeAccount)
                    balance.toString().shouuld.equal(tokens(0.1).toString(), 'feeAccount received fee')
                })

                it("updates filled orders", async () => {
                    const orderFilled = await exchange.orderFilled(1)
                    orderFilled.should.equal(true)
                })

                it("emits a trade event", async () => {
                    const log = result.logs[0]
                    log.event.should.equal("trade")
                    const event = logs.args
                    event.id.toString().should.equal("1")
                    event.user.should.equal(user1, "user is correct")
                    event.tokenGet.should.equal(token.address, "token get is correct")
                    event.amountGet.toString().should.equal(tokens(1).toString(), "amount get is correct")
                    event.tokenGive.should.equal(ETHER_ADDRESS, "token give is correct")
                    event.amountGive.toString().should.equal(ether(1).toString(), "amount is correct")
                    event.userFill.toString().should.equal(user2, "userFill is correct")
                    event.timestamp.toString().length.should.be.at.least(1, "timestamp is present")
                })
            })

            describe('failure', async () => {
                
                it("rejects invalid order id", async () => {
                    const invalidOrder = 99999
                    await exchange.fillOrder(invalidOrder, {from: user1}).should.be.rejectedWith(EVM_REVERT)
                })

                it("rejects already filled order", async () => {
                    await exchange.fillOrder('1', {from: user2}).should.be.fulfilled
                    await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })

                it("rejects cancelled order", async () => {
                    await exchange.cancelOrder("1", {from: user1}).should.be.fulfilled
                    await exchange.fillOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })
            })
        })

        describe('cancelling orders', async () => {
            let result

            describe('success', async () => {
                beforeEach(async () => {
                    result = await exchange.cancelOrder("1", {from: user1})
                })
                
                it('updates cancelled orders', async () => {
                    const orderCancelled = await exchange.orderCancelled(1)
                    orderCancelled.should.equal(true)
                })

                it('emits cancel event', async () => {
                    const log = result.logs[0]
                    log.event.should.equal("cancel")
                    const event = logs.args
                    event.id.toString().should.equal("1")
                    event.user.should.equal(user1, "user is correct")
                    event.tokenGet.should.equal(token.address, "token get is correct")
                    event.amountGet.toString().should.equal(tokens(1).toString(), "amount get is correct")
                    event.tokenGive.should.equal(ETHER_ADDRESS, "token give is correct")
                    event.amountGive.toString().should.equal(ether(1).toString(), "amount is correct")
                    event.timestamp.toString().length.should.be.at.least(1, "timestamp is present")
                })

            })

            describe('failure', async () => {
                it("rejects invalid order", async () => {
                    const invalidOrder = 99999
                    await exchange.cancelOrder(invalidOrder, {from: user1}).should.be.rejectedWith(EVM_REVERT)
                })

                it('rejects unauthorized order', async () => {
                    await exchange.cancelOrder('1', {from: user2}).should.be.rejectedWith(EVM_REVERT)
                })

            })

        })
    })
    */
})