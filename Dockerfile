FROM marlic/rpi-node6:6.10.0-1

ARG TAG
RUN npm install -g dns-proxy2@${TAG} && npm cache clean

USER node
WORKDIR /home/node

EXPOSE 8053/udp

ARG GIT_SHA
ARG BUILD_FROM

LABEL app.git_sha_on_build_time=${GIT_SHA} \
      app.build_from=${BUILD_FROM}\
      app.version=${TAG}

CMD [ "dns-proxy", "--config", "conf.json" ]
