Rails.application.routes.draw do
  devise_for :users
  root 'pages#home'

  resources :exercises, only: [:index, :show, :edit, :update], param: :name do
    resources :submissions, only: [:index, :create]
  end
  resources :submissions, only: [:index, :show, :create]
  resources :users do
    resources :submissions, only: [:index]
  end

  resources :submissions do
    resources :tutor, only:[:show]
  end

  # Webhooks
  match '/webhooks/update_exercises', via: [:get, :post], :to => 'webhooks#update_exercises'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html

  # Serve websocket cable requests in-process
  # mount ActionCable.server => '/cable'
end
