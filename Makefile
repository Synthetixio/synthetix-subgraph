collateral-erc20:
	npm run codegen:collateral-erc20-loans
	npm run build:collateral-erc20-loans
	env-cmd npm run deploy:collateral-erc20-loans

collateral-erc20-kovan:
	npm run codegen:collateral-erc20-loans:kovan
	npm run build:collateral-erc20-loans:kovan
	env-cmd npm run deploy:collateral-erc20-loans:kovan

collateral-eth:
	npm run codegen:collateral-eth-loans
	npm run build:collateral-eth-loans
	env-cmd npm run deploy:collateral-eth-loans

collateral-eth-kovan:
	npm run codegen:collateral-eth-loans:kovan
	npm run build:collateral-eth-loans:kovan
	env-cmd npm run deploy:collateral-eth-loans:kovan

shorts:
	npm run codegen:shorts
	npm run build:shorts
	env-cmd npm run deploy:shorts

shorts-kovan:
	npm run codegen:shorts:kovan
	npm run build:shorts:kovan
	env-cmd npm run deploy:shorts:kovan

delegate-approvals:
	npm run codegen:delegate-approvals
	npm run build:delegate-approvals
	env-cmd npm run deploy:delegate-approvals

delegate-approvals-kovan:
	npm run codegen:delegate-approvals:kovan
	npm run build:delegate-approvals:kovan
	env-cmd npm run deploy:delegate-approvals:kovan

.PHONY: \
	collateral-erc20 \
	collateral-erc20-kovan \
	collateral-eth \
	collateral-eth-kovan \
	shorts \
	shorts-kovan \
	delegate-approvals \
	delegate-approvals-kovan