#!/bin/bash
# ./start.sh "http:\/\/192.168.3.148:8545" 5306 3005 85 100
#./start.sh "http:\/\/192.168.3.148:8545" 5306 3005 85 1 "up"
#./start.sh "http:\/\/192.168.3.149:8555" 5306 3007 87 2 "down"

BASEDIR=$(dirname "$0")
cd "$BASEDIR"/.. || exit
ROOTDIR=$(pwd)
echo "Explorer_Sipc_RpcUrl=$1, Explorer_MySql_PORT=$2, Explorer_Backend_PORT=$3, Explorer_Frontend_PORT=$4, Explorer_Container_Index=$5"

export Explorer_Sipc_RpcUrl=$1
export Explorer_MySql_PORT=$2
export Explorer_Backend_PORT=$3
export Explorer_Frontend_PORT=$4
export Explorer_Container_Index=$5

pwd
echo "rpcUrl is : $Explorer_Sipc_RpcUrl"
echo "docker file  is : explorer$5.yml"

explorer_name="explorer$5"
echo $explorer_name
cd "$ROOTDIR" || exit
sed  -i ".bak" "s/^.*gethServer.*$/\"gethServer\": \""$Explorer_Sipc_RpcUrl"\",/" ./"$explorer_name".json
cd singleChain

if [ "$6" == "down" ]
then
  docker-compose  -f "$explorer_name".yml down
elif [ "$6" == "down -v" ]; then
  docker-compose  -f "$explorer_name".yml down -v
elif [ "$6" == "up" ]; then
  docker-compose  -f "$explorer_name".yml up
elif [ "$6" == "up -d" ]; then
  docker-compose  -f "$explorer_name".yml up -d
fi

