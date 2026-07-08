#!/bin/bash

IFS=$'\n';
function log_and_exit() {
  echo "$1 not available";
  exit 1;
}

##### MongoDB  #####
if docker exec mongo mongosh --quiet --eval 'db.adminCommand("ping").ok' 2>/dev/null | grep -q 1; then echo "Mongo up and running"; else log_and_exit "MongoDB"; fi

##### RabbitMQ #####
if curl --connect-timeout 10 --retry 10 --retry-max-time 60 --silent --show-error -kL http://localhost/15672; then echo "RabbitMQ up and running"; else log_and_exit "RabbitMQ"; fi

#####   TMDB   #####
if curl --connect-timeout 10 --retry 10 --retry-max-time 60 --silent --show-error -kL http://localhost:8020/status; then echo "TMDB up and running"; else log_and_exit "TMDB"; fi

#####   Webapp   #####
if curl --connect-timeout 10 --retry 10 --retry-max-time 60 --silent --show-error -kL http://localhost; then echo "Webapp up and running"; else log_and_exit "Webapp"; fi

