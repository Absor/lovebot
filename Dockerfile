FROM mhart/alpine-node:latest

ENV HOME /opt/app

WORKDIR ${HOME}

COPY ./build ${HOME}
RUN npm install --production
RUN rm package.json

CMD ["node", "lovebot/index.js"]
