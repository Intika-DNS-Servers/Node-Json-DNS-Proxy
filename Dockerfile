FROM marlic/rpi-node6:6.10.0-1

RUN npm install -g dns-proxy2@1.0.2 && npm cache clean

USER node
WORKDIR /home/node

EXPOSE 8053/udp

ARG GIT_SHA
ARG BUILD_FROM

LABEL app.git_sha_on_build_time=${GIT_SHA} \
      app.build_from=${BUILD_FROM}

CMD [ "dns-proxy", "--config", "conf.json" ]
