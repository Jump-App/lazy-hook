FROM ubuntu

RUN apt-get update && \
  apt-get install -y git curl unzip && \
  rm -rf /var/lib/apt/lists/*

USER ubuntu

RUN curl -fsSL https://bun.sh/install | bash
