from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Supabase
    supabase_url:         str = ""
    supabase_service_key: str = ""
    supabase_anon_key:    str = ""

    # OpenAI
    openai_api_key:       str = ""

    # Anthropic
    anthropic_api_key:    str = ""

    # Monad
    monad_rpc_url:        str = "https://testnet-rpc.monad.xyz"
    private_key:          str = ""

    # Contracts
    agent_registry_address:    str = ""
    task_escrow_address:       str = ""
    reputation_engine_address: str = ""

    # App
    environment:          str = "development"

    class Config:
        env_file = ".env"
        extra    = "ignore"


settings = Settings()
