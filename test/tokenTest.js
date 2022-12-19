const { result } = require("lodash")
const BN = require("bignumber.js")

require("chai").use(require("chai-as-promised")).should()

// get token 
const Token = artifacts.require("./Token")

//decimal places
const tokens = (n) => { return new BN(n * 10 ** 18)}

//rejections
const EVM_REVERT = "VM Exception while processing transaction: revert"
const reject = "ERC20: transfer amount exceeds balance"

contract("Token", ([deployer, receiver, exchange]) => {

    let token
    let name = "Anon"
    let decimals = 18
    let totalSupply = tokens(100000)
    let symbol = "AN"

    beforeEach(async () => {
        //fetch token from chain
        token = await Token.new()
    })

    describe("deployment", async () => {

        it("checks name", async () => {
            
            //pulls name
            const result = await token.name()

            //checks name
            result.should.equal(name)
            
        })

        it("checks symbol", async () => {

            const result = await token.symbol()
            result.should.equal(symbol)

        })

        it("checks decimals", async () => {
            const result = await token.decimals()
            let number = new BN(result)
            number = number.toString()
            let decimal = decimals.toString()
            number.should.equal(decimal)
        })

        it("checks supply", async () => {
            const result = await token.totalSupply()
            let number = new BN(result)
            number = number.toString()
            let supply = totalSupply.toString()
            number.should.equal(supply)
        })
    })

    describe("sending tokens", async () => {
        
        let result
        let amount 

        describe("success", async () => {
            beforeEach(async () => {

                amount = tokens(100)
                result = await token.transfer(receiver, amount, {from: deployer})
            })

            it("checks token transfer", async () => {
                let balanceOf
                var remaining = tokens(99900)
                var sent = tokens(100)
            
                balanceOf = await token.balanceOf(deployer)
                balanceOf = new BN(balanceOf)
                balanceOf.toString().should.equal(remaining.toString())
                balanceOf = new BN(balanceOf)
                balanceOf = await token.balanceOf(receiver)
                balanceOf.toString().should.equal(sent.toString())
            })

            it('emits a Transfer event', () => {
                const log = result.logs[0]
                log.event.should.equal('Transfer')
                const event = log.args
                event.from.toString().should.equal(deployer, 'from is correct')
                event.to.should.equal(receiver, 'to is correct')
                event.value.toString().should.equal(amount.toString(), 'value is correct')
            })
        })

        describe('failure', () => {
            it('rejects insufficient balances', async () => {
                let invalidAmount
                invalidAmount = tokens(100000000) // 100 million - greater than total supply
                await token.transfer(receiver, invalidAmount, { from: deployer }).should.be.rejectedWith(reject)
          
                // Attempt transfer tokens, when you have none
                invalidAmount = tokens(10) // recipient has no tokens
                await token.transfer(deployer, invalidAmount, { from: receiver }).should.be.rejectedWith(reject)
            })
          
            it('rejects invalid recipients', () => {
                token.transfer(0x0, amount, { from: deployer }).should.be.rejected
            })
        })

    })

    describe('delegated token transfers', () => {
        let result
        let amount
    
        beforeEach(async () => {
          amount = tokens(100)
          await token.approve(exchange, amount, { from: deployer })
        })
    
        describe('success', () => {
          beforeEach(async () => {
            result = await token.transferFrom(deployer, receiver, amount, { from: exchange })
          })
    
          it('transfers token balances', async () => {
            let balanceOf
            balanceOf = await token.balanceOf(deployer)
            balanceOf = new BN(balanceOf)
            balanceOf.toString().should.equal(new BN(tokens(99900)).toString())
            balanceOf = await token.balanceOf(receiver)
            balanceOf = new BN(balanceOf)
            balanceOf.toString().should.equal(new BN(tokens(100)).toString())
          })
    
          it('resets the allowance', async () => {
            const allowance = await token.allowance(deployer, exchange)
            allowance.toString().should.equal('0')
          })
    
          it('emits a Transfer event', () => {
            const log = result.logs[0]
            log.event.should.equal('Transfer')
            const event = log.args
            event.from.toString().should.equal(deployer, 'from is correct')
            event.to.should.equal(receiver, 'to is correct')
            event.value.toString().should.equal(amount.toString(), 'value is correct')
          })
        })
    
        describe('failure', () => {
          it('rejects insufficient amounts', () => {
            // Attempt transfer too many tokens
            const invalidAmount = tokens(100000000)
            token.transferFrom(deployer, receiver, invalidAmount, { from: exchange }).should.be.rejectedWith(reject)
          })
    
          it('rejects invalid recipients', () => {
            token.transferFrom(deployer, 0x0, amount, { from: exchange }).should.be.rejected
          })
        })
    })
})
