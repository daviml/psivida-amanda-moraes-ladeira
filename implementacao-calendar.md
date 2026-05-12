# Plano de Implementação: Integração Google Agenda

Este documento descreve as etapas necessárias para conectar o sistema de agendamento da PsiVida com a Google Agenda da Amanda Moraes Ladeira, permitindo a criação automática de eventos e links do Google Meet.

## 1. Configuração do Google Cloud Console

Para que o site tenha permissão de editar a agenda, precisamos configurar uma "identidade" para ele no Google.

### Passos:
1.  Acesse o [Google Cloud Console](https://console.cloud.google.com/).
2.  No topo da tela, clique na seleção de projetos e **selecione o seu projeto existente** (provavelmente chamado `psivida-17dd3`).
3.  Vá em **APIs & Services > Library** e ative a **Google Calendar API**.
4.  Vá em **APIs & Services > Credentials** e clique em **Create Credentials > Service Account**.
    *   Nome: `agenda-bot`
    *   ID: `agenda-bot@seu-projeto.iam.gserviceaccount.com`
5.  Após criar, clique na conta de serviço, vá na aba **Keys** e clique em **Add Key > Create New Key (JSON)**.
    *   **IMPORTANTE**: Salve este arquivo JSON em um local seguro. Ele contém a "chave mestra" da integração.
6.  **Liberar acesso na Agenda**: 
    *   Abra a Google Agenda da Amanda.
    *   Vá em **Configurações > Configurações da agenda [E-mail da Amanda]**.
    *   Role até **Compartilhar com pessoas específicas**.
    *   Adicione o e-mail da *Service Account* que você criou.
    *   Mude a permissão para: **Fazer alterações em eventos**.

## 2. Configuração do Ambiente (Firebase Blaze)

As funções automáticas exigem que o projeto Firebase esteja no **Plano Blaze (Pay-as-you-go)**.

### Passos:
1.  No console do Firebase, mude o plano de Spark para Blaze.
2.  Inicialize o suporte a funções no projeto:
    ```bash
    firebase init functions
    ```

## 3. Desenvolvimento da Cloud Function

Criaremos uma função que "escuta" novos agendamentos no banco de dados e os envia para o Google.

### Lógica da Função (`onCreateAppointment`):
*   **Gatilho**: Novo documento na coleção `appointments`.
*   **Ações**:
    1.  Ler dados: Data, hora, e-mail do paciente e tipo de serviço.
    2.  Autenticar com o Google usando a chave da Service Account.
    3.  Chamar `calendar.events.insert`.
    4.  Ativar `conferenceData` para gerar o link do **Google Meet**.
    5.  Salvar o link do Meet de volta no documento do Firestore para que o paciente possa vê-lo.

## 4. Atualizações na Interface (Frontend)

### Painel Admin:
*   Exibir o status da sincronização (✅ Sincronizado / ⏳ Sincronizando).
*   Mostrar o link do Meet gerado ao lado de cada consulta.

### Área do Paciente:
*   Na tela de sucesso do agendamento, exibir o botão: **"Adicionar à minha agenda"**.
*   Exibir o link da sala do Meet assim que for gerado.

## 5. Próximos Passos Sugeridos

1.  [ ] Validar se o plano Blaze pode ser ativado.
2.  [ ] Criar o projeto no Google Cloud e obter o JSON da Service Account.
3.  [ ] Configurar as variáveis de ambiente (Secrets) no Firebase com os dados do JSON.
4.  [ ] Implementar o código da Function.
