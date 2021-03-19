import {ContractService} from '../services/contract'


// ContractService.getTotalContractFee().then(console.log)
// ContractService.getTxFeeChatData().then(console.log)
// ContractService.getContractDetailByAddress('0xe47b5ae21e2f4aa4ee41c872a4da26e54e0825ce').then(console.log)
ContractService.getContractFeeList(10,1).then(console.log)
