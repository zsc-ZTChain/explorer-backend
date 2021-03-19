import {CrossService} from '../services/cross'


// CrossService.getCrossMakerList("0xB9D7dF1a34A28c7B82Acc841C12959ba00B51131").then(console.log)
// CrossService.getWaitTakerList(10,1,1).then(console.log)
CrossService.getCrossDetail("0x27df187e4db570a30ab8fad4f472e42dfcf269451a99082eca129c61a7c5ed39").then(tx => {
    console.log(tx)
})
