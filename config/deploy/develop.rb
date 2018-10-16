set :stage, :dev

# don't specify db as it's not needed for unipept
server 'naos.ugent.be', user: 'dodona', roles: %i[web app db worker], ssh_options: {
  port: 4840
}

set :branch, ENV['BRANCH'] || 'develop'
set :rails_env, :development

set :delayed_job_workers, 3

