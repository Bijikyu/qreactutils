{ pkgs }:
{
  deps = [
    pkgs.pkg-config
    pkgs.git
    pkgs.patchelf
    pkgs.musl
    pkgs.tmux
    pkgs.nodejs_20
  ];
}
