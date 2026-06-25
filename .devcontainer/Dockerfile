FROM ubuntu

RUN apt-get update \
  && apt-get install -y \
    curl \
    git \
    inotify-tools \
    nodejs \
    sudo \
    unzip \
  && rm -rf /var/lib/apt/lists/*

RUN usermod -aG sudo ubuntu \
  && echo "ubuntu ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/ubuntu

USER ubuntu

RUN curl -fsSL https://bun.sh/install | bash
RUN curl -fsSL https://elixir-lang.org/install.sh | sh -s -- elixir@1.20.2 otp@28.4

USER root

RUN ln -s /home/ubuntu/.elixir-install/installs/otp/28.4/bin/* /usr/local/bin/
RUN ln -s /home/ubuntu/.elixir-install/installs/elixir/1.20.2-otp-28/bin/* /usr/local/bin/
RUN ln -s /home/ubuntu/.bun/bin/* /usr/local/bin/
