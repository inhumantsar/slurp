{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";
    systems.url = "github:nix-systems/default";
  };

  outputs =
    { systems, nixpkgs, ... }@inputs:
    let
      eachSystem = f: nixpkgs.lib.genAttrs (import systems) (system: f nixpkgs.legacyPackages.${system});
    in
    {
      devShells = eachSystem (pkgs: 
      let 
        beans = pkgs.buildGoModule rec {
           pname = "beans";
           version = "0.3.4";
           src = pkgs.fetchFromGitHub {
             owner = "hmans";
             repo = "beans";
             rev = "v${version}";
             sha256 = "sha256-JDw7zz/ZQnBz7hb5DsuBFgeBJJCl8/EhVp9Z3//ky0Y=";
           };
           vendorHash = "sha256-6S+BihxnpZSifoR+JKhOomfGcPtgNc6XXoQhSmPRL2Q=";
        };
      in
      {
        default = pkgs.mkShell         
        {
          buildInputs = [
            pkgs.nodejs

            # You can set the major version of Node.js to a specific one instead
            # of the default version
            # pkgs.nodejs-22_x

            # Comment out one of these to use an alternative package manager.
            # pkgs.yarn
            # pkgs.pnpm
            # pkgs.bun

            pkgs.nodePackages.typescript
            pkgs.nodePackages.typescript-language-server

            pkgs.gh
            pkgs.opencode
            beans
          ];
        };
      });
    };
}

